'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell/app-shell'
import { ReportsPanel } from '@/components/reports/reports-panel'
import { useMe } from '@/components/app-shell/use-me'

export default function AdminReportsPage() {
   const router = useRouter()
   const { me, loading: meLoading } = useMe()

   React.useEffect(() => {
      if (meLoading) return
      if (!me) router.push('/auth/login')
      else if (me.role !== 'admin') router.push('/')
   }, [me, meLoading, router])

   return (
      <AppShell title="Admin • Reports" onSearch={() => {}}>
         <ReportsPanel />
      </AppShell>
   )
}
