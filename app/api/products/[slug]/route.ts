import { ok, fail } from '@/lib/api/response'
import { createClient } from '@/lib/supabase/server'

export async function GET(_: Request, { params }: { params: Promise<{ slug: string }> }) {
   const { supabase } = await createClient()
   const { slug } = await params

   const { data: product, error } = await supabase
      .from('products')
      .select('id,category_id,name,slug,description,price_idr,image_path,created_at')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

   if (error) return fail('Product not found', 404)

   const { data: variants, error: varErr } = await supabase
      .from('product_variants')
      .select('product_id,code,label,price_delta_idr,is_default,sort_order')
      .eq('is_active', true)
      .eq('product_id', product.id)
      .order('sort_order', { ascending: true })

   if (varErr) return fail('Failed to fetch variants', 500, { error: varErr.message })

   return ok({
      product: {
         ...product,
         variants: variants ?? [],
      },
   })
}
