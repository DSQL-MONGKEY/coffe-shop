import { fail } from '@/lib/api/response'
import { createClient } from '@/lib/supabase/server'

export async function requireAdmin() {
   const { supabase } = await createClient()
   const { data: auth, error: authErr } = await supabase.auth.getUser()

   if (authErr || !auth.user) {
      return { ok: false as const, response: fail('Unauthorized', 401), user: null, supabase }
   }

   const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', auth.user.id)
      .maybeSingle()

   if (pErr) {
      return { ok: false as const, response: fail('Failed to load profile', 500, { error: pErr.message }), user: null, supabase }
   }

   if (profile?.role !== 'admin') {
      return { ok: false as const, response: fail('Forbidden', 403), user: null, supabase }
   }

   return { ok: true as const, response: null, user: auth.user, supabase }
}
