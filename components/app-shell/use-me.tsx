'use client'

import * as React from 'react'

type Me = {
   id: string
   email: string | null
   fullName?: string | null
   role?: 'admin' | 'user'
}

export function useMe() {
   const [me, setMe] = React.useState<Me | null>(null)
   const [loading, setLoading] = React.useState(true)

   React.useEffect(() => {
      let mounted = true
      ;(async () => {
         try {
            const res = await fetch('/api/me', { cache: 'no-store' })
            const json = await res.json().catch(() => null)
            if (!mounted) return
            if (json?.success) setMe(json.data?.user ?? json.data ?? null)
            else setMe(null)
         } finally {
            if (mounted) setLoading(false)
         }
      })()
      return () => {
         mounted = false
      }
   }, [])

   return { me, loading }
}
