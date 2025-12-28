import { z } from 'zod'
import { ok, fail } from '@/lib/api/response'
import { requireAdmin } from '@/lib/api/admin'
import { supabaseService } from '@/lib/supabase/service'


const CreateCategorySchema = z.object({
   name: z.string().min(1),
   slug: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug'),
   sort_order: z.number().int().min(0).optional(),
   is_active: z.boolean().optional(),
})

export async function GET() {
   const gate = await requireAdmin()
   if (!gate.ok) return gate.response

   const { data, error } = await supabaseService
      .from('categories')
      .select('id,name,slug,sort_order,is_active,created_at,updated_at')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

   if (error) return fail('Failed to fetch categories', 500, { error: error.message })
   return ok({ categories: data ?? [] })
}

export async function POST(req: Request) {
   const gate = await requireAdmin()
   if (!gate.ok) return gate.response

   const body = await req.json().catch(() => null)
   const parsed = CreateCategorySchema.safeParse(body)
   if (!parsed.success) return fail('Invalid payload', 400, { issues: parsed.error.flatten() })

   const payload = {
      name: parsed.data.name,
      slug: parsed.data.slug,
      sort_order: parsed.data.sort_order ?? 0,
      is_active: parsed.data.is_active ?? true,
   }

   const { data, error } = await supabaseService
      .from('categories')
      .insert(payload)
      .select('id,name,slug,sort_order,is_active,created_at,updated_at')
      .single()

   if (error) {
      // handle slug duplicate nicely
      const msg = error.message?.toLowerCase().includes('duplicate') ? 'Slug already exists' : 'Failed to create category'
      return fail(msg, 400, { error: error.message })
   }

   return ok({ category: data }, 201)
}
