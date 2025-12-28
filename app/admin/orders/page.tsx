'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell/app-shell'
import { OrdersTable } from '@/components/orders/order-table'
import { useMe } from '@/components/app-shell/use-me'
import type { OrderListItem } from '@/components/orders/type'

export default function AdminOrdersPage() {
   const router = useRouter()
   const { me, loading: meLoading } = useMe()

   const [q, setQ] = React.useState('')
   const [orders, setOrders] = React.useState<OrderListItem[]>([])
   const [loading, setLoading] = React.useState(true)
   const [msg, setMsg] = React.useState<string | null>(null)

   const load = React.useCallback(async (keyword: string) => {
      setLoading(true)
      setMsg(null)
      const qs = new URLSearchParams()
      if (keyword) qs.set('q', keyword)
      const res = await fetch(`/api/admin/orders?${qs.toString()}`, { cache: 'no-store' })
      const json = await res.json().catch(() => null)
      if (json?.success) setOrders(json.data.orders ?? [])
      else setMsg('Failed to load orders')
      setLoading(false)
   }, [])

   React.useEffect(() => {
      load(q)
   }, [q, load])

   // guard
   React.useEffect(() => {
      if (meLoading) return
      if (!me) router.push('/auth/login')
      else if (me.role !== 'admin') router.push('/')
   }, [me, meLoading, router])

   return (
      <AppShell title="Admin • Orders" onSearch={setQ}>
         {msg && <div className="mb-4 rounded-2xl border bg-background p-3 text-sm text-red-500">{msg}</div>}
         {loading ? <div className="text-sm text-muted-foreground">Loading…</div> : <OrdersTable mode="admin" orders={orders} />}
      </AppShell>
   )
}
