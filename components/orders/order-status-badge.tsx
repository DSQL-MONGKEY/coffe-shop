'use client'

import { Badge } from '@/components/ui/badge'
import type { OrderStatus } from '@/components/orders/type'

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
   const label =
      status === 'pending_payment' ? 'Pending'
      : status === 'paid' ? 'Paid'
      : status === 'preparing' ? 'Preparing'
      : status === 'ready' ? 'Ready'
      : status === 'completed' ? 'Completed'
      : 'Cancelled'

   // tanpa set warna khusus (biar konsisten dark/light)
   return (
      <Badge variant={status === 'paid' || status === 'completed' ? 'default' : 'secondary'} className="rounded-full">
         {label}
      </Badge>
   )
}
