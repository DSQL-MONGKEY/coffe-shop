import { z } from 'zod'
import { ok, fail } from '@/lib/api/response'
import { requireAdmin } from '@/lib/api/admin'
import { supabaseService } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

const UpdateProductSchema = z.object({
   category_id: z.string().uuid().nullable().optional(),
   name: z.string().min(1).optional(),
   slug: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug').optional(),
   description: z.string().max(500).nullable().optional(),
   price_idr: z.number().int().min(0).optional(),
   image_path: z.string().max(500).nullable().optional(),
   is_active: z.boolean().optional(),
})

export async function GET(_: Request, { params }: { params: { id: string } }) {
   const gate = await requireAdmin()
   if (!gate.ok) return gate.response

   const { data, error } = await supabaseService
      .from('products')
      .select('id,category_id,name,slug,description,price_idr,image_path,is_active,created_at,updated_at')
      .eq('id', params.id)
      .single()

   if (error || !data) return fail('Product not found', 404)
   return ok({ product: data })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
   const gate = await requireAdmin()
   if (!gate.ok) return gate.response

   const body = await req.json().catch(() => null)
   const parsed = UpdateProductSchema.safeParse(body)
   if (!parsed.success) return fail('Invalid payload', 400, { issues: parsed.error.flatten() })
   if (Object.keys(parsed.data).length === 0) return fail('No changes provided', 400)

   const { data, error } = await supabaseService
      .from('products')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', params.id)
      .select('id,category_id,name,slug,description,price_idr,image_path,is_active,created_at,updated_at')
      .single()

   if (error) {
      const msg = error.message?.toLowerCase().includes('duplicate') ? 'Slug already exists' : 'Failed to update product'
      return fail(msg, 400, { error: error.message })
   }
   if (!data) return fail('Product not found', 404)

   return ok({ product: data })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
   const gate = await requireAdmin()
   if (!gate.ok) return gate.response

   // Optional cleanup: delete variants dulu (kalau FK cascade belum di-set)
   await supabaseService.from('product_variants').delete().eq('product_id', params.id)

   const { error } = await supabaseService.from('products').delete().eq('id', params.id)
   if (error) return fail('Failed to delete product', 500, { error: error.message })

   return ok({ deleted: true })
}
