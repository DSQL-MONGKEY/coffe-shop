import { z } from 'zod'
import { ok, fail } from '@/lib/api/response'
import { requireAdmin } from '@/lib/api/admin'
import { supabaseService } from '@/lib/supabase/service'


const UpdateCategorySchema = z.object({
   name: z.string().min(1).optional(),
   slug: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug').optional(),
   sort_order: z.number().int().min(0).optional(),
   is_active: z.boolean().optional(),
})

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
   const gate = await requireAdmin()
   const { id } = await params
   if (!gate.ok) return gate.response

   const { data, error } = await supabaseService
      .from('categories')
      .select('id,name,slug,sort_order,is_active,created_at,updated_at')
      .eq('id', id)
      .single()

   if (error || !data) return fail('Category not found', 404)
   return ok({ category: data })
}

export async function PATCH(req: Request,{ params }: { params: Promise<{ id: string }> }) {
   const gate = await requireAdmin()
   const { id } = await params
   if (!gate.ok) return gate.response

   const body = await req.json().catch(() => null)
   const parsed = UpdateCategorySchema.safeParse(body)
   if (!parsed.success) return fail('Invalid payload', 400, { issues: parsed.error.flatten() })

   if (Object.keys(parsed.data).length === 0) return fail('No changes provided', 400)

   const { data, error } = await supabaseService
      .from('categories')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id,name,slug,sort_order,is_active,created_at,updated_at')
      .single()

   if (error) {
      const msg = error.message?.toLowerCase().includes('duplicate') ? 'Slug already exists' : 'Failed to update category'
      return fail(msg, 400, { error: error.message })
   }

   if (!data) return fail('Category not found', 404)
   return ok({ category: data })
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
   const gate = await requireAdmin()
   const { id } = await params
   if (!gate.ok) return gate.response

   // Best practice: biasanya bukan delete, tapi disable. Tapi requirement admin boleh delete.
   const { error } = await supabaseService.from('categories').delete().eq('id', id)
   if (error) return fail('Failed to delete category', 500, { error: error.message })

   return ok({ deleted: true })
}
