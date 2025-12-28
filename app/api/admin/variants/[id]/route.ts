import { z } from 'zod'
import { ok, fail } from '@/lib/api/response'
import { requireAdmin } from '@/lib/api/admin'
import { supabaseService } from '@/lib/supabase/service'


const UpdateVariantSchema = z.object({
   code: z.string().min(1).max(20).optional(),
   label: z.string().min(1).max(50).optional(),
   price_delta_idr: z.number().int().min(-100000).max(100000).optional(),
   sort_order: z.number().int().min(0).optional(),
   is_default: z.boolean().optional(),
   is_active: z.boolean().optional(),
})

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
   const gate = await requireAdmin()
   if (!gate.ok) return gate.response

   const { id } = await params;
   const { data, error } = await supabaseService
      .from('product_variants')
      .select('id,product_id,code,label,price_delta_idr,is_default,sort_order,is_active,created_at,updated_at')
      .eq('id', id)
      .single()

   if (error || !data) return fail('Variant not found', 404)
   return ok({ variant: data })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
   const gate = await requireAdmin()
   if (!gate.ok) return gate.response
   
   const { id } = await params;
   const body = await req.json().catch(() => null)
   const parsed = UpdateVariantSchema.safeParse(body)
   if (!parsed.success) return fail('Invalid payload', 400, { issues: parsed.error.flatten() })
   if (Object.keys(parsed.data).length === 0) return fail('No changes provided', 400)

   // if set is_default true -> unset others in same product
   if (parsed.data.is_default === true) {
      const { data: current, error: cErr } = await supabaseService
         .from('product_variants')
         .select('product_id')
         .eq('id', id)
         .single()

      if (cErr || !current) return fail('Variant not found', 404)

      await supabaseService
         .from('product_variants')
         .update({ is_default: false })
         .eq('product_id', current.product_id)
   }

   const { data, error } = await supabaseService
      .from('product_variants')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id,product_id,code,label,price_delta_idr,is_default,sort_order,is_active,created_at,updated_at')
      .single()

   if (error) {
      const msg = error.message?.toLowerCase().includes('duplicate')
         ? 'Variant code already exists for this product'
         : 'Failed to update variant'
      return fail(msg, 400, { error: error.message })
   }
   if (!data) return fail('Variant not found', 404)

   return ok({ variant: data })
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
   const gate = await requireAdmin()
   const { id } = await params;
   if (!gate.ok) return gate.response

   const { error } = await supabaseService.from('product_variants').delete().eq('id', id)
   if (error) return fail('Failed to delete variant', 500, { error: error.message })

   return ok({ deleted: true })
}
