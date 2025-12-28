'use client'

import * as React from 'react'
import { AppShell } from '@/components/app-shell/app-shell'
import { OrdersTable } from '@/components/orders/order-table'
import { MidtransSnapLoader } from '@/components/payments/midtrans-snap'
import { payOrderWithMidtrans } from '@/components/payments/pay-with-midtrans'
import type { OrderListItem } from '@/components/orders/type'

export default function OrdersPage() {
   const [orders, setOrders] = React.useState<OrderListItem[]>([])
   const [loading, setLoading] = React.useState(true)
   const [msg, setMsg] = React.useState<string | null>(null)

   const load = React.useCallback(async () => {
      setLoading(true)
      setMsg(null)
      const res = await fetch('/api/orders', { cache: 'no-store' })
      const json = await res.json().catch(() => null)
      if (json?.success) setOrders(json.data.orders ?? [])
      else setMsg('Failed to load orders')
      setLoading(false)
   }, [])

   React.useEffect(() => {
      load()
   }, [load])

   const onPay = async (orderId: string) => {
      setMsg(null)
      try {
         await payOrderWithMidtrans(orderId)
         await load()
      } catch (e: any) {
         setMsg(e?.message ?? 'Payment error')
      }
   }

   return (
      <AppShell title="My Orders" onSearch={() => {}}>
         <MidtransSnapLoader />

         {msg && <div className="mb-4 rounded-2xl border bg-background p-3 text-sm text-red-500">{msg}</div>}

         {loading ? (
         <div className="text-sm text-muted-foreground">Loading…</div>
         ) : (
         <OrdersTable mode="user" orders={orders} onPay={onPay} />
         )}
      </AppShell>
   )
}
