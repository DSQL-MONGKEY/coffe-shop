'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'

function rupiah(n: number) {
   return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default function OrderDetailPage() {
   const params = useParams<{ id: string }>()
   const router = useRouter()
   const id = params.id

   const [data, setData] = React.useState<any>(null)
   const [note, setNote] = React.useState('')
   const [saving, setSaving] = React.useState(false)
   const [msg, setMsg] = React.useState<string | null>(null)

   const load = React.useCallback(async () => {
      setMsg(null)
      const res = await fetch(`/api/orders/${id}`, { cache: 'no-store' })
      const json = await res.json().catch(() => null)
      if (!json?.success) return setMsg('Failed to load order')
      setData(json.data)
      setNote(json.data?.order?.note ?? '')
   }, [id])

   React.useEffect(() => {
      load()
   }, [load])

   const saveNote = async () => {
      setSaving(true)
      setMsg(null)
      try {
         const res = await fetch(`/api/orders/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ note }),
         })
         const json = await res.json().catch(() => null)
         if (!json?.success) throw new Error(json?.data?.message ?? 'Failed to update')
         await load()
      } catch (e: any) {
         setMsg(e?.message ?? 'Error')
      } finally {
         setSaving(false)
      }
   }

   const order = data?.order
   const items = data?.items ?? []
   const payment = data?.payment

   return (
      <AppShell title="Order Detail" onSearch={() => {}}>
         {msg && <div className="mb-4 rounded-2xl border bg-background p-3 text-sm text-red-500">{msg}</div>}

         {!order ? (
         <div className="text-sm text-muted-foreground">Loading…</div>
         ) : (
         <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <Card className="rounded-2xl">
               <CardContent className="p-4 space-y-3">
               <div className="flex items-start justify-between gap-3">
                  <div>
                     <div className="font-semibold">{order.order_no}</div>
                     <div className="text-xs text-muted-foreground">{order.customer_name}</div>
                  </div>
                  <OrderStatusBadge status={order.status} />
               </div>

               <Separator />

               <div className="text-sm font-semibold">Items</div>
               <div className="space-y-2">
                  {items.map((it: any) => (
                     <div key={it.id} className="flex items-center justify-between text-sm">
                     <div className="text-muted-foreground">
                        {it.product_name} × {it.qty}
                     </div>
                     <div className="font-semibold">{rupiah(it.line_total_idr)}</div>
                     </div>
                  ))}
               </div>

               <Separator />

               <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">Total</div>
                  <div className="text-lg font-semibold">{rupiah(order.total_idr)}</div>
               </div>

               <div className="text-xs text-muted-foreground">
                  Payment: {payment?.status ?? '—'} {payment?.method ? `• ${payment.method}` : ''}
               </div>
               </CardContent>
            </Card>

            <Card className="rounded-2xl">
               <CardContent className="p-4 space-y-3">
               <div className="font-semibold">Note</div>
               <Textarea
                  className="rounded-xl min-h-[120px]"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Optional note…"
                  disabled={order.status !== 'pending_payment'}
               />
               <Button
                  className="w-full rounded-xl"
                  onClick={saveNote}
                  disabled={saving || order.status !== 'pending_payment'}
               >
                  {saving ? 'Saving…' : 'Save note'}
               </Button>

               <Button variant="outline" className="w-full rounded-xl" onClick={() => router.push('/orders')}>
                  Back
               </Button>

               {order.status !== 'pending_payment' && (
                  <div className="text-xs text-muted-foreground">
                     Note tidak bisa diubah setelah order diproses.
                  </div>
               )}
               </CardContent>
            </Card>
         </div>
         )}
      </AppShell>
   )
}
