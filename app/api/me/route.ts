import { ok, fail } from '@/lib/api/response'
import { createClient } from '@/lib/supabase/server'


export async function GET() {
   const { supabase } = await createClient()

   const { data, error } = await supabase.auth.getUser()
   if (error || !data.user) {
      return fail('Unauthorized', 401)
   }

   const user = data.user

   // Ambil profile (role, full_name, dll)
   const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('user_id,full_name,phone,role,created_at,updated_at')
      .eq('user_id', user.id)
      .maybeSingle()

   // kalau profile gagal load (selain "not found"), treat error
   if (pErr) {
      return fail('Failed to load profile', 500, { error: pErr.message })
   }

   return ok({
      user: {
         id: user.id,
         email: user.email,
         fullName: profile?.full_name ?? null,
         phone: profile?.phone ?? null,
         role: profile?.role ?? 'user',
      },
      profile: profile ?? null,
   })
}
