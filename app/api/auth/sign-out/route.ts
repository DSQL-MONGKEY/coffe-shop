import type { NextRequest } from 'next/server'
import { ok } from '@/lib/api/response'
import { createRouteClient } from '@/lib/supabase/route'

export async function POST(req: NextRequest) {
   const { supabase, applyCookies } = createRouteClient(req)
   await supabase.auth.signOut()
   return applyCookies(ok({ signed_out: true }))
}
