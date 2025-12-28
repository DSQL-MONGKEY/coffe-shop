import { createClient } from '@/lib/supabase/server'
import { fail } from '@/lib/api/response'

export async function requireUser() {
   const { supabase } = await createClient()
   const { data, error } = await supabase.auth.getUser()

   if (error || !data.user) {
      return { supabase, user: null, response: fail('Unauthorized', 401) }
   }
   return { supabase, user: data.user, response: null }
}

export async function requireAdmin() {
   const { supabase, user, response } = await requireUser()
   if (response) return { supabase, user, response }

   const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

   if (error) return { supabase, user, response: fail('Failed to load profile', 500) }
   if (profile?.role !== 'admin') return { supabase, user, response: fail('Forbidden', 403) }

   return { supabase, user, response: null }
}
