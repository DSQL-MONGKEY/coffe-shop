'use client'

import * as React from 'react'

declare global {
   interface Window {
      snap?: { pay: (token: string, options?: any) => void }
   }
}

export function MidtransSnapLoader() {
   React.useEffect(() => {
      const key = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY
      if (!key) return

      // avoid duplicate
      if (document.getElementById('midtrans-snap')) return

      const script = document.createElement('script')
      script.id = 'midtrans-snap'
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js'
      script.setAttribute('data-client-key', key)
      script.async = true
      document.body.appendChild(script)

      return () => {
         // optional: keep script cached
      }
   }, [])

   return null
}
