import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminGate({ children }: { children: React.ReactNode }) {
   const { supabase } = await createClient()

   const { data: userRes } = await supabase.auth.getUser()
   const user = userRes?.user
   if (!user) redirect('/auth/login')

   
   // kamu tadi pakai "user_id" — pastikan sesuai skema kamu.
   const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)        
      .maybeSingle()


   if (profile?.role !== 'admin') redirect('/')

   return <>{children}</>
}
