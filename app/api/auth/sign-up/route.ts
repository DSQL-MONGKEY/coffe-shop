import { z } from 'zod'
import type { NextRequest } from 'next/server'
import { ok, fail } from '@/lib/api/response'
import { createRouteClient } from '@/lib/supabase/route'
import { supabaseService } from '@/lib/supabase/service'

const SignUpSchema = z.object({
   email: z.string().email(),
   password: z.string().min(6),
   full_name: z.string().min(1).optional(),
   phone: z.string().min(6).optional(),
})

export async function POST(req: NextRequest) {
   const body = await req.json().catch(() => null)
   const parsed = SignUpSchema.safeParse(body)
   if (!parsed.success) return fail('Invalid payload', 400, { issues: parsed.error.flatten() })

   const { supabase, applyCookies } = createRouteClient(req)

   // NOTE:
   // Kalau Confirm Email = ON, session akan null.
   // Kalau Confirm Email = OFF, session akan ada. :contentReference[oaicite:1]{index=1}
   const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
   });

   if (error) return fail('Failed to sign up', 400, { error: error.message })
   // Pastikan profile ada (simple & reliable)
   if (data.user?.id) {
      await supabaseService.from('profiles').upsert({
         user_id: data.user.id,
         full_name: parsed.data.full_name ?? null,
         phone: parsed.data.phone ?? null,
         role: 'user',
      })
   }

   return applyCookies(
      ok({
         user: { id: data.user?.id, email: data.user?.email },
         session: data.session
         ? { access_token: data.session.access_token, expires_in: data.session.expires_in }
         : null,
         needs_email_confirmation: data.session ? false : true,
      })
   )
}
