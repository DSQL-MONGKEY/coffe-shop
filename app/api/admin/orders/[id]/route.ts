import { z } from 'zod'
import { ok, fail } from '@/lib/api/response'
import { requireAdmin } from '@/lib/api/admin'
import { supabaseService } from '@/lib/supabase/service'


const UpdateOrderSchema = z.object({
   status: z.enum(['pending_payment', 'paid', 'preparing', 'ready', 'completed', 'cancelled']).optional(),
   note: z.string().max(300).optional(),
})

export async function GET(_: Request, { params }: { params: { id: string } }) {
   const gate = await requireAdmin()
   const { id } = await params;
   if (!gate.ok) return gate.response

   const { data: order, error: oErr } = await supabaseService
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

   if (oErr || !order) return fail('Order not found', 404)

   const { data: items, error: iErr } = await supabaseService
      .from('order_items')
      .select('id,product_id,product_name,unit_price_idr,qty,options,line_total_idr,created_at')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true })

   if (iErr) return fail('Failed to fetch items', 500, { error: iErr.message })

   const { data: payment, error: pErr } = await supabaseService
      .from('payments')
      .select('*')
      .eq('order_id', order.id)
      .maybeSingle()

   if (pErr) return fail('Failed to fetch payment', 500, { error: pErr.message })

   return ok({ order, items: items ?? [], payment: payment ?? null })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
   const gate = await requireAdmin()
   if (!gate.ok) return gate.response

   const body = await req.json().catch(() => null)
   const parsed = UpdateOrderSchema.safeParse(body)
   if (!parsed.success) return fail('Invalid payload', 400, { issues: parsed.error.flatten() })
   if (Object.keys(parsed.data).length === 0) return fail('No changes provided', 400)

   // update order
   const { data: updated, error: uErr } = await supabaseService
      .from('orders')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select('id,order_no,status,total_idr,customer_name,updated_at')
      .single()

   if (uErr) return fail('Failed to update order', 500, { error: uErr.message })
   if (!updated) return fail('Order not found', 404)

   // jika admin set status paid -> update payments juga (biar konsisten)
   if (parsed.data.status === 'paid') {
      const paidAt = new Date().toISOString()
      await supabaseService.from('payments').upsert({
         order_id: params.id,
         provider: 'manual',
         provider_order_id: updated.order_no,
         status: 'paid',
         paid_at: paidAt,
         gross_amount_idr: updated.total_idr,
         method: 'admin_mark_paid',
      } as any)
   }

   return ok({ order: updated })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
   const gate = await requireAdmin()
   if (!gate.ok) return gate.response

   // Hard delete: hapus children dulu agar aman (kalau cascade belum diset)
   const { error: iErr } = await supabaseService.from('order_items').delete().eq('order_id', params.id)
   if (iErr) return fail('Failed to delete order items', 500, { error: iErr.message })

   const { error: pErr } = await supabaseService.from('payments').delete().eq('order_id', params.id)
   if (pErr) return fail('Failed to delete payment', 500, { error: pErr.message })

   const { error: oErr } = await supabaseService.from('orders').delete().eq('id', params.id)
   if (oErr) return fail('Failed to delete order', 500, { error: oErr.message })

   return ok({ deleted: true })
}
