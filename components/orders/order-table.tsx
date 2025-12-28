'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import type { OrderListItem } from '@/components/orders/type'

function rupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(iso: string) {
   try {
      return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
   } catch {
      return iso
   }
}

export function OrdersTable({
   mode,
   orders,
   onPay,
}: {
   mode: 'user' | 'admin'
   orders: OrderListItem[]
   onPay?: (orderId: string) => void
}) {
   return (
      <div className="rounded-2xl border bg-background/80 backdrop-blur overflow-hidden">
         <Table>
         <TableHeader>
            <TableRow>
               <TableHead>Order No</TableHead>
               {mode === 'admin' && <TableHead>Customer</TableHead>}
               <TableHead>Status</TableHead>
               <TableHead className="text-right">Total</TableHead>
               <TableHead>Created</TableHead>
               <TableHead className="text-right">Action</TableHead>
            </TableRow>
         </TableHeader>

         <TableBody>
            {orders.map((o) => {
               const canPay =
               mode === 'user' &&
               o.status === 'pending_payment' &&
               (o.payment?.status ?? 'pending') === 'pending'

               const detailHref = mode === 'admin' ? `/admin/orders/${o.id}` : `/orders/${o.id}`

               return (
               <TableRow key={o.id}>
                  <TableCell className="font-medium">{o.order_no}</TableCell>

                  {mode === 'admin' && (
                     <TableCell className="text-muted-foreground">{o.customer_name ?? '—'}</TableCell>
                  )}

                  <TableCell>
                     <div className="flex items-center gap-2">
                     <OrderStatusBadge status={o.status} />
                     {o.payment?.status && (
                        <span className="text-xs text-muted-foreground">• pay: {o.payment.status}</span>
                     )}
                     </div>
                  </TableCell>

                  <TableCell className="text-right font-semibold">{rupiah(o.total_idr)}</TableCell>
                  <TableCell className="text-muted-foreground">{fmtDate(o.created_at)}</TableCell>

                  <TableCell className="text-right">
                     <div className="inline-flex gap-2">
                     <Button asChild variant="outline" className="rounded-xl">
                        <Link href={detailHref}>View</Link>
                     </Button>

                     {canPay && (
                        <Button className="rounded-xl" onClick={() => onPay?.(o.id)}>
                           Pay
                        </Button>
                     )}
                     </div>
                  </TableCell>
               </TableRow>
               )
            })}

            {orders.length === 0 && (
               <TableRow>
               <TableCell colSpan={mode === 'admin' ? 6 : 5} className="py-10 text-center text-muted-foreground">
                  No orders yet.
               </TableCell>
               </TableRow>
            )}
         </TableBody>
         </Table>
      </div>
   )
}
