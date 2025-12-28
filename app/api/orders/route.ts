import { z } from 'zod'
import { ok, fail } from '@/lib/api/response'
import { createClient } from '@/lib/supabase/server'
import { supabaseService } from '@/lib/supabase/service'


function toInt(v: string | null, def: number) {
   const n = v ? Number(v) : NaN
   return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : def
}

const CartItemSchema = z.object({
   product_id: z.string().uuid(),
   qty: z.number().int().min(1),
   options: z
      .object({
         temp: z.enum(['hot', 'ice']).optional(),
         size: z.string().optional(), // contoh: 'S' | 'M' | 'L'
      })
      .optional(),
})

const CreateOrderSchema = z.object({
   customer_name: z.string().min(1),
   customer_phone: z.string().optional(),
   note: z.string().max(300).optional(),
   items: z.array(CartItemSchema).min(1),
})

function makeOrderNo() {
   const d = new Date()
   const y = d.getFullYear()
   const m = String(d.getMonth() + 1).padStart(2, '0')
   const day = String(d.getDate()).padStart(2, '0')
   const rand = Math.random().toString(36).slice(2, 8).toUpperCase()
   return `CSH-${y}${m}${day}-${rand}`
}

export async function GET(req: Request) {
   const { supabase } = await createClient()
   const { data: auth } = await supabase.auth.getUser()
   if (!auth.user) return fail('Unauthorized', 401)

   const url = new URL(req.url)
   const limit = Math.min(50, Math.max(1, toInt(url.searchParams.get('limit'), 20)))
   const offset = toInt(url.searchParams.get('offset'), 0)
   const status = url.searchParams.get('status')?.trim() || null

   let q = supabaseService
      .from('orders')
      .select('id,order_no,status,total_idr,created_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

   if (status) q = q.eq('status', status)

   const { data: orders, error } = await q
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

   return ok({ orders: result, meta: { limit, offset, status } })
}

export async function POST(req: Request) {
   const { supabase } = await createClient()
   const { data: auth } = await supabase.auth.getUser()
   if (!auth.user) return fail('Unauthorized', 401)

   const body = await req.json().catch(() => null)
   const parsed = CreateOrderSchema.safeParse(body)
   if (!parsed.success) return fail('Invalid payload', 400, { issues: parsed.error.flatten() })

   const { customer_name, customer_phone, note, items } = parsed.data

   const productIds = [...new Set(items.map((i) => i.product_id))]
   const { data: products, error: prodErr } = await supabaseService
      .from('products')
      .select('id,name,price_idr,is_active')
      .in('id', productIds)

   if (prodErr || !products) return fail('Failed to load products', 500, { error: prodErr?.message })

   const productMap = new Map(products.map((p) => [p.id, p]))

   for (const it of items) {
      const p = productMap.get(it.product_id)
      if (!p || !p.is_active) return fail('Product not available', 400, { product_id: it.product_id })
   }

   // load variants yang diperlukan (size)
   const sizeCodes = [...new Set(items.map((i) => i.options?.size).filter(Boolean) as string[])]
   const { data: variants, error: varErr } =
      sizeCodes.length > 0
         ? await supabaseService
            .from('product_variants')
            .select('product_id,code,price_delta_idr,is_active')
            .in('product_id', productIds)
            .in('code', sizeCodes)
         : { data: [], error: null }

   if (varErr) return fail('Failed to load variants', 500, { error: varErr.message })

   const vKey = (pid: string, code: string) => `${pid}:${code}`
   const vMap = new Map((variants ?? []).map((v) => [vKey(v.product_id, v.code), v]))

   // build snapshot items + hitung total server-side
   const orderItems: any[] = []
   let subtotal = 0

   for (const it of items) {
      const p = productMap.get(it.product_id)!
      let unit = p.price_idr

      const size = it.options?.size
      if (size) {
         const v = vMap.get(vKey(it.product_id, size))
         if (!v || !v.is_active) return fail('Invalid variant', 400, { product_id: it.product_id, size })
         unit = Math.max(0, unit + v.price_delta_idr)
      }

      const line = unit * it.qty
      subtotal += line

      orderItems.push({
         product_id: it.product_id,
         product_name: p.name,
         unit_price_idr: unit,
         qty: it.qty,
         options: it.options ?? null,
         line_total_idr: line,
      })
   }

   const discount = 0
   const total = Math.max(0, subtotal - discount)

   // insert order (retry order_no collision)
   let created: any = null
   let orderNo = makeOrderNo()

   for (let attempt = 0; attempt < 3; attempt++) {
      const { data: order, error: oErr } = await supabaseService
         .from('orders')
         .insert({
         user_id: auth.user.id,
         order_no: orderNo,
         status: 'pending_payment',
         fulfillment: 'pickup',
         customer_name,
         customer_phone: customer_phone ?? null,
         note: note ?? null,
         subtotal_idr: subtotal,
         discount_idr: discount,
         total_idr: total,
         })
         .select('id,order_no,status,total_idr,created_at')
         .single()

      if (!oErr && order) {
         created = order
         break
      }
      orderNo = makeOrderNo()
   }

   if (!created) return fail('Failed to create order', 500)

   // insert items (best-effort cleanup kalau gagal)
   const { error: itemsErr } = await supabaseService
      .from('order_items')
      .insert(orderItems.map((i) => ({ ...i, order_id: created.id })))

   if (itemsErr) {
      await supabaseService.from('orders').delete().eq('id', created.id)
      return fail('Failed to create order items', 500, { error: itemsErr.message })
   }

   // init payment manual
   const { error: payErr } = await supabaseService.from('payments').upsert({
      order_id: created.id,
      provider: 'manual',
      provider_order_id: created.order_no,
      status: 'pending',
      gross_amount_idr: total,
      // opsional kalau kolom ada:
      method: 'pay_at_pickup',
   } as any)

   if (payErr) {
      await supabaseService.from('order_items').delete().eq('order_id', created.id)
      await supabaseService.from('orders').delete().eq('id', created.id)
      return fail('Failed to init payment', 500, { error: payErr.message })
   }

   return ok({ order: created })
}
