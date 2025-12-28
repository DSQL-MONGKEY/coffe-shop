import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

type CookieToSet = { name: string; value: string; options?: any }

export function createRouteClient(request: NextRequest) {
   const pending: CookieToSet[] = []

   const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      {
         cookies: {
         getAll() {
            return request.cookies.getAll()
         },
         setAll(cookiesToSet) {
            pending.push(...cookiesToSet)
         },
         },
      }
   )

   const applyCookies = (res: NextResponse) => {
      pending.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
      return res
   }

   return { supabase, applyCookies }
}
