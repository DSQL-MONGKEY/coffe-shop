'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Mode = 'signin' | 'signup'

const SignInSchema = z.object({
   email: z.string().email('Email tidak valid'),
   password: z.string().min(6, 'Password minimal 6 karakter'),
})

const SignUpSchema = SignInSchema.extend({
   full_name: z.string().min(1, 'Nama wajib diisi').optional(),
   phone: z.string().min(6, 'Nomor HP tidak valid').optional(),
   confirm_password: z.string().min(6, 'Ulangi password minimal 6 karakter'),
   }).refine((v) => v.password === v.confirm_password, {
   message: 'Password tidak sama',
   path: ['confirm_password'],
})

export function AuthForm({ mode }: { mode: Mode }) {
   const router = useRouter()
   const [loading, setLoading] = useState(false)
   const [errorMsg, setErrorMsg] = useState<string | null>(null)

   const schema = useMemo(() => (mode === 'signup' ? SignUpSchema : SignInSchema), [mode])

   const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setErrorMsg(null)
      setLoading(true)

      const form = new FormData(e.currentTarget)
      const raw = Object.fromEntries(form.entries())

      const parsed = schema.safeParse(raw)
      if (!parsed.success) {
         const first = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0]
         setErrorMsg(first ?? 'Input tidak valid')
         setLoading(false)
         return
      }

      const endpoint = mode === 'signup' ? '/api/auth/sign-up' : '/api/auth/sign-in'
      const payload =
         mode === 'signup'
         ? {
               email: parsed.data.email,
               password: parsed.data.password,
               full_name: (parsed.data as any).full_name || undefined,
               phone: (parsed.data as any).phone || undefined,
            }
         : {
               email: parsed.data.email,
               password: parsed.data.password,
            }

      const res = await fetch(endpoint, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         // same-origin => cookie akan tersimpan otomatis
         body: JSON.stringify(payload),
      })

      const json = await res.json().catch(() => null)
      if (!json?.success) {
         setErrorMsg(json?.data?.message ?? 'Terjadi kesalahan')
         setLoading(false)
         return
      }

      // Signup: jika confirm email ON, session null -> tampilkan info
      if (mode === 'signup' && json?.data?.needs_email_confirmation) {
         setErrorMsg('Akun berhasil dibuat, sekarang kamu bisa lanjut ke halaman login.')
         setLoading(false)
         return
      }

      router.replace('/') // atau '/menu'
      router.refresh()
   }

return (
      <form onSubmit={onSubmit} className="space-y-5">
         {mode === 'signup' && (
         <div className="grid gap-2">
            <Label htmlFor="full_name">Nama (opsional)</Label>
            <Input id="full_name" name="full_name" placeholder="John Wick" />
         </div>
         )}

         <div className="grid gap-2">
         <Label htmlFor="email">Email</Label>
         <Input id="email" name="email" type="email" placeholder="you@email.com" required />
         </div>

         <div className="grid gap-2">
         <Label htmlFor="password">Password</Label>
         <Input id="password" name="password" type="password" placeholder="••••••••" required />
         </div>

         {mode === 'signup' && (
         <>
            <div className="grid gap-2">
               <Label htmlFor="confirm_password">Ulangi Password</Label>
               <Input id="confirm_password" name="confirm_password" type="password" required />
            </div>

            <div className="grid gap-2">
               <Label htmlFor="phone">No HP (opsional)</Label>
               <Input id="phone" name="phone" placeholder="08xxxx" />
            </div>
         </>
         )}

         {errorMsg && (
         <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMsg}
         </div>
         )}

         <Button type="submit" className="w-full rounded-xl" disabled={loading}>
         {loading ? 'Please wait...' : mode === 'signin' ? 'Login' : 'Create account'}
         </Button>

         <div className="text-center text-sm text-stone-600">
         {mode === 'signin' ? (
            <>
               Belum punya akun?{' '}
               <Link href="/auth/sign-up" className="underline underline-offset-4">
               Sign up
               </Link>
            </>
         ) : (
            <>
               Sudah punya akun?{' '}
               <Link href="/auth/login" className="underline underline-offset-4">
               Login
               </Link>
            </>
         )}
         </div>
      </form>
   )
}
