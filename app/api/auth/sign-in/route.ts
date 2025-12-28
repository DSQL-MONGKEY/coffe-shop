import { z } from 'zod'
import type { NextRequest } from 'next/server'
import { ok, fail } from '@/lib/api/response'
import { createRouteClient } from '@/lib/supabase/route'

const SignInSchema = z.object({
   email: z.string().email(),
   password: z.string().min(6),
})

export async function POST(req: NextRequest) {
   const body = await req.json().catch(() => null)
   const parsed = SignInSchema.safeParse(body)
   if (!parsed.success) return fail('Invalid payload', 400, { issues: parsed.error.flatten() })

   const { supabase, applyCookies } = createRouteClient(req)

   const { data, error } = await supabase.auth.signInWithPassword(parsed.data)
   if (error) return fail('Invalid credentials', 400, { error: error.message })

   // data.session tersedia kalau berhasil login
   return applyCookies(
      ok({
         user: { 
            id: data.user?.id, 
            email: data.user?.email,
         },
         session: data.session
         ? { 
            access_token: data.session.access_token, 
            expires_in: data.session.expires_in 
         }
         : null,
      })
   )
}
