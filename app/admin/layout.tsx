import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'


function AdminLoading() {
   return (
      <div className="min-h-svh grid place-items-center p-6">
         <div className="rounded-2xl border bg-background/80 backdrop-blur p-4 text-sm text-muted-foreground">
            Loading admin authorization…
         </div>
      </div>
   )
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
   const { supabase } = await createClient()
   const { data: userRes } = await supabase.auth.getUser()

   if (!userRes?.user) redirect('/auth/login')

   const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userRes.user.id)
      .maybeSingle()

   if (profile?.role !== 'admin') redirect('/')

   return <Suspense fallback={<AdminLoading />}>{children}</Suspense>
}
