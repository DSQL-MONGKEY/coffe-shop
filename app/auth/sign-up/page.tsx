import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AuthShell } from '@/components/auth/auth-shell'
import { AuthForm } from '@/components/auth/auth-form'

export default function Page() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Create account" description="Daftar dulu untuk mulai order pickup.">
          <div className="space-y-3">
            <div className="h-10 rounded-xl bg-stone-100" />
            <div className="h-10 rounded-xl bg-stone-100" />
            <div className="h-10 rounded-xl bg-stone-100" />
            <div className="h-10 rounded-xl bg-stone-100" />
            <div className="h-10 rounded-xl bg-stone-100" />
          </div>
        </AuthShell>
      }
    >
      <SignUpGate />
    </Suspense>
  )
}

async function SignUpGate() {
  const { supabase } = await createClient()
  const { data } = await supabase.auth.getUser()
  if (data.user) redirect('/')

  return (
    <AuthShell title="Create account" description="Daftar dulu supaya order kamu aman & valid.">
      <AuthForm mode="signup" />
    </AuthShell>
  )
}
