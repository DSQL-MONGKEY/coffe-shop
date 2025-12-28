import { z } from 'zod'
import { ok, fail } from '@/lib/api/response'
import { createClient } from '@/lib/supabase/server'
import { supabaseService } from '@/lib/supabase/service'

const UpdateOrderSchema = z.object({
   customer_name: z.string().min(1).optional(),
   customer_phone: z.string().min(6).optional(),
   note: z.string().max(300).optional(),
})

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
   const { supabase } = await createClient()
   const { data: auth } = await supabase.auth.getUser()
   const { id } = await params;
   if (!auth.user) return fail('Unauthorized', 401)

   const { data: order, error: oErr } = await supabaseService
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

   if (oErr || !order) return fail('Order not found', 404)
   if (order.user_id !== auth.user.id) return fail('Forbidden', 403)

   const { data: items, error: iErr } = await supabaseService
      .from('order_items')
      .select('id,product_id,product_name,unit_price_idr,qty,options,line_total_idr,created_at')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true })

   if (iErr) return fail('Failed to fetch items', 500, { error: iErr.message })

   const { data: payment, error: pErr } = await supabaseService
      .from('payments')
      .select('provider,method,status,paid_at,gross_amount_idr,created_at')
      .eq('order_id', order.id)
      .maybeSingle()

   if (pErr) return fail('Failed to fetch payment', 500, { error: pErr.message })

   return ok({ order, items: items ?? [], payment: payment ?? null })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
   const { supabase } = await createClient()
   const { data: auth } = await supabase.auth.getUser()
   const { id } = await params;
   
   if (!auth.user) return fail('Unauthorized', 401)

   const body = await req.json().catch(() => null)
   const parsed = UpdateOrderSchema.safeParse(body)
   if (!parsed.success) return fail('Invalid payload', 400, { issues: parsed.error.flatten() })

   const { data: order, error: oErr } = await supabaseService
      .from('orders')
      .select('id,user_id,status')
      .eq('id', id)
      .single()

   if (oErr || !order) return fail('Order not found', 404)
   if (order.user_id !== auth.user.id) return fail('Forbidden', 403)

   // Rule sederhana: user hanya boleh edit sebelum dibayar/diproses
   if (order.status !== 'pending_payment') {
      return fail('Order can no longer be edited', 409, { status: order.status })
   }

   const patch = parsed.data
   if (Object.keys(patch).length === 0) return fail('No changes provided', 400)

   const { data: updated, error: uErr } = await supabaseService
      .from('orders')
      .update({
         ...(patch.customer_name !== undefined ? { customer_name: patch.customer_name } : {}),
         ...(patch.customer_phone !== undefined ? { customer_phone: patch.customer_phone } : {}),
         ...(patch.note !== undefined ? { note: patch.note } : {}),
         updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)
      .select('id,order_no,status,customer_name,customer_phone,note,total_idr,updated_at')
      .single()

   if (uErr || !updated) return fail('Failed to update order', 500, { error: uErr?.message })

   return ok({ order: updated })
}
