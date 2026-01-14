'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { OrdersTable } from '@/components/orders/order-table'
import type { OrderListItem } from '@/components/orders/type'
import { Save, ChevronDown } from 'lucide-react'

function rupiah(n: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function fmtDateShort(d: Date) {
  return d.toISOString().slice(0, 10)
}

type Preset = 'today' | 'this_week' | 'this_month' | 'custom'

function getRangeForPreset(p: Preset) {
   const now = new Date()
   const start = new Date(now)
   const end = new Date(now)

   if (p === 'today') {
      // start: 00:00, end: 23:59
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
   } else if (p === 'this_week') {
      // assume week starts on Monday
      const day = now.getDay() || 7 // sunday=0 -> 7
      const diffToMon = day - 1
      start.setDate(now.getDate() - diffToMon)
      start.setHours(0, 0, 0, 0)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
   } else if (p === 'this_month') {
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      end.setMonth(start.getMonth() + 1)
      end.setDate(0) // last day previous month => end of month
      end.setHours(23, 59, 59, 999)
   } else {
      // custom default last 7 days
      start.setDate(now.getDate() - 6)
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
   }

   return { from: start, to: end }
}

export function ReportsPanel() {
   const [preset, setPreset] = React.useState<Preset>('today')
   const initialRange = getRangeForPreset('today')
   const [fromDate, setFromDate] = React.useState<string>(fmtDateShort(initialRange.from))
   const [toDate, setToDate] = React.useState<string>(fmtDateShort(initialRange.to))
   const [status, setStatus] = React.useState<string>('all')
   const [q, setQ] = React.useState<string>('')

   const [orders, setOrders] = React.useState<OrderListItem[]>([])
   const [loading, setLoading] = React.useState(false)
   const [error, setError] = React.useState<string | null>(null)

   // debounce timer
   const [debounceKey, setDebounceKey] = React.useState(0)
   React.useEffect(() => {
      const t = setTimeout(() => setDebounceKey((k) => k + 1), 300)
      return () => clearTimeout(t)
   }, [preset, fromDate, toDate, status, q])

   // sync preset -> from/to
   React.useEffect(() => {
      if (preset === 'custom') return
      const r = getRangeForPreset(preset)
      setFromDate(fmtDateShort(r.from))
      setToDate(fmtDateShort(r.to))
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [preset])

   const fetchOrders = React.useCallback(async () => {
      setLoading(true)
      setError(null)
      try {
         const qs = new URLSearchParams()
         if (fromDate) qs.set('from', fromDate)
         if (toDate) qs.set('to', toDate)
         if (status && status !== 'all') qs.set('status', status)
         if (q) qs.set('q', q)
         // limit large enough for a report demo (caveat: for production use pagination/back-end aggregation)
         qs.set('limit', '1000')

         const res = await fetch(`/api/admin/orders?${qs.toString()}`, { cache: 'no-store' })
         const json = await res.json().catch(() => null)
         if (!json?.success) {
         setError(json?.data?.message ?? 'Failed to load orders')
         setOrders([])
         } else {
         // normalize / map to OrderListItem if backend returns payment and meta
         // backend should return orders array matching OrderListItem shape
         setOrders(json.data.orders ?? [])
         }
      } catch (e: any) {
         setError(e?.message ?? 'Network error')
         setOrders([])
      } finally {
         setLoading(false)
      }
   }, [fromDate, toDate, status, q, debounceKey])

   // refetch on debounceKey change
   React.useEffect(() => {
      fetchOrders()
   }, [fetchOrders, debounceKey])

   // compute aggregates client-side
   const totals = React.useMemo(() => {
      const totalOrders = orders.length
      const totalRevenue = orders.reduce((acc, o) => acc + (o.total_idr ?? 0), 0)
      const byStatus = orders.reduce<Record<string, number>>((acc, o) => {
         acc[o.status] = (acc[o.status] ?? 0) + 1
         return acc
      }, {})
      return { totalOrders, totalRevenue, byStatus }
   }, [orders])

   // CSV export
   const exportCSV = () => {
      if (!orders.length) return
      const header = ['order_no', 'customer_name', 'status', 'total_idr', 'created_at']
      const rows = orders.map((o) => [o.order_no, o.customer_name ?? '', o.status, String(o.total_idr), o.created_at])
      const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(',')).join('\n')
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `reports_${fromDate}_to_${toDate}.csv`
      a.click()
      URL.revokeObjectURL(url)
   }

   return (
      <div className="space-y-6">
         {/* Header + filters */}
         <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
         <div>
            <h2 className="text-xl font-semibold">Orders Reports</h2>
            <div className="text-sm text-muted-foreground">Filter, inspect and export orders (daily, weekly, monthly).</div>
         </div>

         <div className="flex gap-2 items-center">
            <div className="inline-flex gap-2 rounded-xl border p-2 bg-background/80">
               <button
               className={`rounded-md px-3 py-1 text-sm ${preset === 'today' ? 'bg-amber-100/70 font-semibold text-stone-900' : 'text-muted-foreground'}`}
               onClick={() => setPreset('today')}
               >
               Today
               </button>
               <button
               className={`rounded-md px-3 py-1 text-sm ${preset === 'this_week' ? 'bg-amber-100/70 font-semibold text-stone-900' : 'text-muted-foreground'}`}
               onClick={() => setPreset('this_week')}
               >
               This week
               </button>
               <button
               className={`rounded-md px-3 py-1 text-sm ${preset === 'this_month' ? 'bg-amber-100/70 font-semibold text-stone-900' : 'text-muted-foreground'}`}
               onClick={() => setPreset('this_month')}
               >
               This month
               </button>
               <button
               className={`rounded-md px-3 py-1 text-sm ${preset === 'custom' ? 'bg-amber-100/70 font-semibold text-stone-900' : 'text-muted-foreground'}`}
               onClick={() => setPreset('custom')}
               >
               Custom
               </button>
            </div>

            <div className="inline-flex items-center gap-2">
               <Input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPreset('custom') }} className="rounded-xl" />
               <Input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPreset('custom') }} className="rounded-xl" />
            </div>

            <Select value={status} onValueChange={(v) => setStatus(v)}>
               <SelectTrigger className="rounded-xl">
               <SelectValue>
                  {status === 'all' ? 'All status' : status}
               </SelectValue>
               </SelectTrigger>
               <SelectContent>
               <SelectItem value="all">All status</SelectItem>
               <SelectItem value="pending_payment">Pending</SelectItem>
               <SelectItem value="paid">Paid</SelectItem>
               <SelectItem value="preparing">Preparing</SelectItem>
               <SelectItem value="ready">Ready</SelectItem>
               <SelectItem value="completed">Completed</SelectItem>
               <SelectItem value="cancelled">Cancelled</SelectItem>
               </SelectContent>
            </Select>

            <Input placeholder="Search order_no / customer" value={q} onChange={(e) => setQ(e.target.value)} className="rounded-xl" />

            <Button onClick={exportCSV} className="rounded-xl" variant="outline" title="Export CSV">
               <Save className="h-4 w-4" />
               Export
            </Button>
         </div>
         </div>

         {/* Aggregates */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
         <div className="rounded-2xl border p-4">
            <div className="text-sm text-muted-foreground">Orders</div>
            <div className="text-2xl font-semibold">{totals.totalOrders}</div>
         </div>
         <div className="rounded-2xl border p-4">
            <div className="text-sm text-muted-foreground">Total revenue</div>
            <div className="text-2xl font-semibold">{rupiah(totals.totalRevenue)}</div>
         </div>
         <div className="rounded-2xl border p-4">
            <div className="text-sm text-muted-foreground">By status</div>
            <div className="flex gap-2 mt-2 flex-wrap">
               {Object.entries(totals.byStatus).map(([k, v]) => (
               <Badge key={k} className="rounded-full">{k} • {v}</Badge>
               ))}
            </div>
         </div>
         </div>

         {/* Table */}
         <div>
         {loading ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
         ) : error ? (
            <div className="text-sm text-red-500">{error}</div>
         ) : (
            <OrdersTable mode="admin" orders={orders} />
         )}
         </div>
      </div>
   )
}
