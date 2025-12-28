import { ok, fail } from '@/lib/api/response'
import { createClient } from '@/lib/supabase/server'


export async function GET() {
   const { supabase } = await createClient()

   const { data, error } = await supabase
      .from('categories')
      .select('id,name,slug,sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

   if (error) return fail('Failed to fetch categories', 500, { error: error.message })
   return ok({ categories: data ?? [] })
}
