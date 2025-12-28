import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseService } from '@/lib/supabase/service'

function sha512(input: string) {
   return crypto.createHash('sha512').update(input).digest('hex')
}

export async function POST(req: Request) {
   const serverKey = process.env.MIDTRANS_SERVER_KEY
   if (!serverKey) return NextResponse.json({ success: false, data: { message: 'Server key not set' } }, { status: 500 })

   const payload = await req.json().catch(() => null)
   if (!payload) return NextResponse.json({ success: false, data: { message: 'Invalid body' } }, { status: 400 })

   const { order_id, status_code, gross_amount, signature_key, transaction_status, fraud_status } = payload

   // verify signature: SHA512(order_id+status_code+gross_amount+ServerKey) :contentReference[oaicite:8]{index=8}
   const expected = sha512(String(order_id) + String(status_code) + String(gross_amount) + serverKey)
   if (expected !== signature_key) {
      return NextResponse.json({ success: false, data: { message: 'Invalid signature' } }, { status: 401 })
   }

   // map Midtrans order_id (order_no) -> our order
   const { data: order } = await supabaseService
      .from('orders')
      .select('id,order_no')
      .eq('order_no', order_id)
      .maybeSingle()

   if (!order) return NextResponse.json({ success: true, data: { ok: true } }) // ignore unknown

   // update payments
   const paid =
      transaction_status === 'settlement' || transaction_status === 'capture'

   const cancelled =
      transaction_status === 'cancel' || transaction_status === 'deny' || transaction_status === 'expire'

   const payStatus = paid ? 'paid' : cancelled ? 'failed' : 'pending'

   await supabaseService.from('payments').upsert({
      order_id: order.id,
      provider: 'midtrans',
      provider_order_id: order_id,
      status: payStatus,
      transaction_status,
      fraud_status,
      provider_payload: payload,
      paid_at: paid ? new Date().toISOString() : null,
   } as any)

   // update order status
   if (paid) {
      await supabaseService.from('orders').update({ status: 'paid', updated_at: new Date().toISOString() }).eq('id', order.id)
   } else if (cancelled) {
      await supabaseService.from('orders').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', order.id)
   }

   return NextResponse.json({ success: true, data: { ok: true } })
}
