'use client'

import * as React from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell/app-shell'
import { useMe } from '@/components/app-shell/use-me'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'

function rupiah(n: number) {
   return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

const STATUSES = ['pending_payment', 'paid', 'preparing', 'ready', 'completed', 'cancelled'] as const

export default function AdminOrderDetailPage() {
   const params = useParams<{ id: string }>()
   const router = useRouter()
   const { me, loading: meLoading } = useMe()
   const id = params.id

   const [data, setData] = React.useState<any>(null)
   const [status, setStatus] = React.useState<string>('')
   const [loading, setLoading] = React.useState(true)
   const [msg, setMsg] = React.useState<string | null>(null)

   const load = React.useCallback(async () => {
      setLoading(true)
      setMsg(null)
      const res = await fetch(`/api/admin/orders/${id}`, { cache: 'no-store' })
      const json = await res.json().catch(() => null)
      if (!json?.success) {
         setMsg('Failed to load order')
         setLoading(false)
         return
      }
      setData(json.data)
      setStatus(json.data?.order?.status ?? '')
      setLoading(false)
   }, [id])

   React.useEffect(() => {
      load()
   }, [load])

   // guard
   React.useEffect(() => {
      if (meLoading) return
      if (!me) router.push('/auth/login')
      else if (me.role !== 'admin') router.push('/')
   }, [me, meLoading, router])

   const saveStatus = async () => {
      setMsg(null)
      const res = await fetch(`/api/admin/orders/${id}`, {
         method: 'PATCH',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ status }),
      })
      const json = await res.json().catch(() => null)
      if (!json?.success) return setMsg(json?.data?.message ?? 'Failed to update')
      await load()
   }

   const deleteOrder = async () => {
      setMsg(null)
      const res = await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => null)
      if (!json?.success) return setMsg(json?.data?.message ?? 'Failed to delete')
      router.push('/admin/orders')
   }

   const order = data?.order
   const items = data?.items ?? []
   const payment = data?.payment

   return (
      <AppShell title="Admin • Order Detail" onSearch={() => {}}>
         {msg && <div className="mb-4 rounded-2xl border bg-background p-3 text-sm text-red-500">{msg}</div>}

         {loading || !order ? (
         <div className="text-sm text-muted-foreground">Loading…</div>
         ) : (
         <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
            <Card className="rounded-2xl">
               <CardContent className="p-4 space-y-3">
               <div className="flex items-start justify-between gap-3">
                  <div>
                     <div className="font-semibold">{order.order_no}</div>
                     <div className="text-xs text-muted-foreground">
                     {order.customer_name} • {order.customer_phone ?? '—'}
                     </div>
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
               <div className="font-semibold">Admin Actions</div>

               <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Update status</div>
                  <Select value={status} onValueChange={setStatus}>
                     <SelectTrigger className="rounded-xl">
                     <SelectValue placeholder="Select status" />
                     </SelectTrigger>
                     <SelectContent>
                     {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                           {s}
                        </SelectItem>
                     ))}
                     </SelectContent>
                  </Select>
                  <Button className="w-full rounded-xl" onClick={saveStatus}>
                     Save
                  </Button>
               </div>

               <Separator />

               <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button variant="destructive" className="w-full rounded-xl">
                     Delete Order
                     </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-2xl">
                     <AlertDialogHeader>
                     <AlertDialogTitle>Delete this order?</AlertDialogTitle>
                     <AlertDialogDescription>
                        This will remove order + items + payment records (hard delete).
                     </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                     <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                     <AlertDialogAction className="rounded-xl" onClick={deleteOrder}>
                        Delete
                     </AlertDialogAction>
                     </AlertDialogFooter>
                  </AlertDialogContent>
               </AlertDialog>

               <Button variant="outline" className="w-full rounded-xl" onClick={() => router.push('/admin/orders')}>
                  Back
               </Button>
               </CardContent>
            </Card>
         </div>
         )}
      </AppShell>
   )
}
