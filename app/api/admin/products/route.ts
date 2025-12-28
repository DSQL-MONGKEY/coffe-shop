import { z } from 'zod'
import { ok, fail } from '@/lib/api/response'
import { requireAdmin } from '@/lib/api/admin'
import { supabaseService } from '@/lib/supabase/service'


const CreateProductSchema = z.object({
   category_id: z.string().uuid().nullable().optional(),
   name: z.string().min(1),
   slug: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug'),
   description: z.string().max(500).optional(),
   price_idr: z.number().int().min(0),
   image_path: z.string().max(500).nullable().optional(),
   is_active: z.boolean().optional(),
})

export async function GET(req: Request) {
   const gate = await requireAdmin()
   if (!gate.ok) return gate.response

   const url = new URL(req.url)
   const q = url.searchParams.get('q')?.trim() || null
   const categoryId = url.searchParams.get('category_id')?.trim() || null
   const active = url.searchParams.get('active') // 'true' | 'false' | null

   let query = supabaseService
      .from('products')
      .select('id,category_id,name,slug,description,price_idr,image_path,is_active,created_at,updated_at')
      .order('created_at', { ascending: false })

   if (categoryId) query = query.eq('category_id', categoryId)
   if (active === 'true') query = query.eq('is_active', true)
   if (active === 'false') query = query.eq('is_active', false)
   if (q) query = query.or(`name.ilike.%${q}%,slug.ilike.%${q}%`)

   const { data, error } = await query
   if (error) return fail('Failed to fetch products', 500, { error: error.message })

   return ok({ products: data ?? [] })
}

export async function POST(req: Request) {
   const gate = await requireAdmin()
   if (!gate.ok) return gate.response

   const body = await req.json().catch(() => null)
   const parsed = CreateProductSchema.safeParse(body)
   if (!parsed.success) return fail('Invalid payload', 400, { issues: parsed.error.flatten() })

   const payload = {
      category_id: parsed.data.category_id ?? null,
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description ?? null,
      price_idr: parsed.data.price_idr,
      image_path: parsed.data.image_path ?? null,
      is_active: parsed.data.is_active ?? true,
   }

   const { data, error } = await supabaseService
      .from('products')
      .insert(payload)
      .select('id,category_id,name,slug,description,price_idr,image_path,is_active,created_at,updated_at')
      .single()

   if (error) {
      const msg = error.message?.toLowerCase().includes('duplicate') ? 'Slug already exists' : 'Failed to create product'
      return fail(msg, 400, { error: error.message })
   }

   return ok({ product: data }, 201)
}
