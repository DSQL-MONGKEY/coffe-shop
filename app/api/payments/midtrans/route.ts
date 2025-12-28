import { ok, fail } from '@/lib/api/response'
import { createClient } from '@/lib/supabase/server'
import { supabaseService } from '@/lib/supabase/service'


function basicAuth(serverKey: string) {
   return 'Basic ' + Buffer.from(serverKey + ':').toString('base64')
}

export async function POST(req: Request) {
   const { supabase } = await createClient()
   const { data: auth } = await supabase.auth.getUser()
   if (!auth.user) return fail('Unauthorized', 401)

   const body = await req.json().catch(() => null)
   const order_id = body?.order_id as string | undefined
   if (!order_id) return fail('order_id required', 400)

   const serverKey = process.env.MIDTRANS_SERVER_KEY
   if (!serverKey) return fail('MIDTRANS_SERVER_KEY is not set', 500)

   // load order + ownership
   const { data: order, error: oErr } = await supabaseService
      .from('orders')
      .select('id,user_id,order_no,total_idr,customer_name,customer_phone,status')
      .eq('id', order_id)
      .single()

   if (oErr || !order) return fail('Order not found', 404)
   if (order.user_id !== auth.user.id) return fail('Forbidden', 403)

   // If token already exist in payments, return it (allow repay) :contentReference[oaicite:6]{index=6}
   const { data: existing } = await supabaseService
      .from('payments')
      .select('snap_token,status,provider')
      .eq('order_id', order.id)
      .maybeSingle()

   if (existing?.provider === 'midtrans' && existing?.snap_token && existing?.status === 'pending') {
      return ok({ token: existing.snap_token, reused: true })
   }

   const { data: items, error: iErr } = await supabaseService
      .from('order_items')
      .select('product_id,product_name,unit_price_idr,qty')
      .eq('order_id', order.id)

   if (iErr) return fail('Failed to load order items', 500, { error: iErr.message })

   const item_details = (items ?? []).map((it) => ({
      id: it.product_id,
      name: it.product_name,
      price: it.unit_price_idr,
      quantity: it.qty,
   }))

   const payload = {
      transaction_details: {
         order_id: order.order_no,
         gross_amount: order.total_idr,
      },
      item_details,
      customer_details: {
         first_name: order.customer_name,
         phone: order.customer_phone ?? undefined,
         email: auth.user.email ?? undefined,
      },
   }

   const snapRes = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
      method: 'POST',
      headers: {
         'Content-Type': 'application/json',
         Authorization: basicAuth(serverKey), // Basic Auth :contentReference[oaicite:7]{index=7}
      },
      body: JSON.stringify(payload),
   })

   const snapJson = await snapRes.json().catch(() => null)

   if (!snapRes.ok) {
      return fail('Midtrans Snap error', 502, { midtrans: snapJson })
   }

   const token = snapJson?.token as string | undefined
   const redirect_url = snapJson?.redirect_url as string | undefined
   if (!token) return fail('Invalid Midtrans response', 502, { midtrans: snapJson })

   // store payment
   await supabaseService.from('payments').upsert({
      order_id: order.id,
      provider: 'midtrans',
      provider_order_id: order.order_no,
      status: 'pending',
      gross_amount_idr: order.total_idr,
      snap_token: token,
      snap_redirect_url: redirect_url ?? null,
   } as any)

   return ok({ token, redirect_url })
}
