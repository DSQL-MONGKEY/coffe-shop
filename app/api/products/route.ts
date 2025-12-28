import { ok, fail } from '@/lib/api/response'
import { createClient } from '@/lib/supabase/server'


function toInt(v: string | null, def: number) {
   const n = v ? Number(v) : NaN
   return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : def
}

export async function GET(req: Request) {
   const { supabase } = await createClient()
   const url = new URL(req.url)

   const q = url.searchParams.get('q')?.trim() ?? ''
   const categorySlug = url.searchParams.get('category')?.trim() ?? ''
   const limit = Math.min(60, Math.max(1, toInt(url.searchParams.get('limit'), 24)))
   const offset = toInt(url.searchParams.get('offset'), 0)

   // Resolve category_id jika category slug dikirim
   let categoryId: string | null = null
   if (categorySlug) {
      const { data: cat, error: catErr } = await supabase
         .from('categories')
         .select('id')
         .eq('slug', categorySlug)
         .eq('is_active', true)
         .maybeSingle()

      if (catErr) return fail('Failed to resolve category', 500, { error: catErr.message })
      if (!cat) return ok({ products: [], meta: { limit, offset, q, category: categorySlug } }) // kategori tidak ada → kosong
      categoryId = cat.id
   }

   // Query products (active only)
   let query = supabase
      .from('products')
      .select('id,category_id,name,slug,description,price_idr,image_path,created_at')
      .eq('is_active', true)

   if (categoryId) query = query.eq('category_id', categoryId)
   if (q) query = query.ilike('name', `%${q}%`)

   const { data: products, error: prodErr } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

   if (prodErr) return fail('Failed to fetch products', 500, { error: prodErr.message })

   const rows = products ?? []
   const ids = rows.map((p) => p.id)

   // Fetch variants untuk product yang tampil
   const { data: variants, error: varErr } = ids.length
      ? await supabase
         .from('product_variants')
         .select('product_id,code,label,price_delta_idr,is_default,sort_order')
         .eq('is_active', true)
         .in('product_id', ids)
         .order('sort_order', { ascending: true })
      : { data: [], error: null }

   if (varErr) return fail('Failed to fetch variants', 500, { error: varErr.message })

   // Group variants by product_id
   const map = new Map<string, any[]>()
   ;(variants ?? []).forEach((v) => {
      const arr = map.get(v.product_id) ?? []
      arr.push(v)
      map.set(v.product_id, arr)
   })

   const result = rows.map((p) => ({
      ...p,
      variants: map.get(p.id) ?? [],
   }))

   return ok({
      products: result,
      meta: { limit, offset, q: q || null, category: categorySlug || null },
   })
}
