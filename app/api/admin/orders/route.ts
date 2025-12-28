import { ok, fail } from '@/lib/api/response'
import { requireAdmin } from '@/lib/api/admin'
import { supabaseService } from '@/lib/supabase/service'


function toInt(v: string | null, def: number) {
   const n = v ? Number(v) : NaN
   return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : def
}

export async function GET(req: Request) {
   const gate = await requireAdmin()
   if (!gate.ok) return gate.response

   const url = new URL(req.url)
   const limit = Math.min(100, Math.max(1, toInt(url.searchParams.get('limit'), 25)))
   const offset = toInt(url.searchParams.get('offset'), 0)

   const status = url.searchParams.get('status')?.trim() || null
   const q = url.searchParams.get('q')?.trim() || null // search by order_no or customer_name

   let query = supabaseService
      .from('orders')
      .select('id,user_id,order_no,status,total_idr,customer_name,created_at')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

   if (status) query = query.eq('status', status)
   if (q) {
      // simple ilike on order_no OR customer_name
      query = query.or(`order_no.ilike.%${q}%,customer_name.ilike.%${q}%`)
   }

   const { data: orders, error } = await query
   if (error) return fail('Failed to fetch orders', 500, { error: error.message })

   const ids = (orders ?? []).map((o) => o.id)
   const { data: payments, error: pErr } = ids.length
      ? await supabaseService
         .from('payments')
         .select('order_id,status,method,paid_at,gross_amount_idr')
         .in('order_id', ids)
      : { data: [], error: null }

   if (pErr) return fail('Failed to fetch payments', 500, { error: pErr.message })

   const payMap = new Map((payments ?? []).map((p) => [p.order_id, p]))
   const result = (orders ?? []).map((o) => ({ ...o, payment: payMap.get(o.id) ?? null }))

   return ok({ orders: result, meta: { limit, offset, status, q } })
}
