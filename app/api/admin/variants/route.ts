import { z } from 'zod'
import { ok, fail } from '@/lib/api/response'
import { requireAdmin } from '@/lib/api/admin'
import { supabaseService } from '@/lib/supabase/service'


const CreateVariantSchema = z.object({
   product_id: z.string().uuid(),
   code: z.string().min(1).max(20), // 'S' | 'M' | 'L' atau 'ICE' dll (kalau nanti)
   label: z.string().min(1).max(50),
   price_delta_idr: z.number().int().min(-100000).max(100000),
   sort_order: z.number().int().min(0).optional(),
   is_default: z.boolean().optional(),
   is_active: z.boolean().optional(),
})

export async function GET(req: Request) {
   const gate = await requireAdmin()
   if (!gate.ok) return gate.response

   const url = new URL(req.url)
   const productId = url.searchParams.get('product_id')?.trim() || null
   const active = url.searchParams.get('active') // true|false|null

   let query = supabaseService
      .from('product_variants')
      .select('id,product_id,code,label,price_delta_idr,is_default,sort_order,is_active,created_at,updated_at')
      .order('product_id', { ascending: true })
      .order('sort_order', { ascending: true })

   if (productId) query = query.eq('product_id', productId)
   if (active === 'true') query = query.eq('is_active', true)
   if (active === 'false') query = query.eq('is_active', false)

   const { data, error } = await query
   if (error) return fail('Failed to fetch variants', 500, { error: error.message })

   return ok({ variants: data ?? [] })
}

export async function POST(req: Request) {
   const gate = await requireAdmin()
   if (!gate.ok) return gate.response

   const body = await req.json().catch(() => null)
   const parsed = CreateVariantSchema.safeParse(body)
   if (!parsed.success) return fail('Invalid payload', 400, { issues: parsed.error.flatten() })

   const payload = {
      product_id: parsed.data.product_id,
      code: parsed.data.code,
      label: parsed.data.label,
      price_delta_idr: parsed.data.price_delta_idr,
      sort_order: parsed.data.sort_order ?? 0,
      is_default: parsed.data.is_default ?? false,
      is_active: parsed.data.is_active ?? true,
   }

   // best practice: 1 default per product (kalau is_default=true)
   if (payload.is_default) {
      await supabaseService
         .from('product_variants')
         .update({ is_default: false })
         .eq('product_id', payload.product_id)
   }

   const { data, error } = await supabaseService
      .from('product_variants')
      .insert(payload)
      .select('id,product_id,code,label,price_delta_idr,is_default,sort_order,is_active,created_at,updated_at')
      .single()

   if (error) {
      const msg = error.message?.toLowerCase().includes('duplicate')
         ? 'Variant code already exists for this product'
         : 'Failed to create variant'
      return fail(msg, 400, { error: error.message })
   }

   return ok({ variant: data }, 201)
}
