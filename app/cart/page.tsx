'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/app-shell/app-shell'
import { useCart } from '@/stores/cart'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { MidtransSnapLoader } from '@/components/payments/midtrans-snap'

function rupiah(n: number) {
   return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export default function CartPage() {
   const router = useRouter()
   const items = useCart((s) => s.items)
   const setQty = useCart((s) => s.setQty)
   const removeItem = useCart((s) => s.removeItem)
   const subtotal = useCart((s) => s.subtotal())
   const clear = useCart((s) => s.clear)

   const [name, setName] = React.useState('')
   const [phone, setPhone] = React.useState('')
   const [note, setNote] = React.useState('')
   const [loading, setLoading] = React.useState(false)
   const [msg, setMsg] = React.useState<string | null>(null)

   const checkout = async () => {
      setMsg(null)
      if (!items.length) return setMsg('Cart masih kosong.')
      if (!name.trim()) return setMsg('Nama wajib diisi.')

      setLoading(true)
      try {
         // 1) create order (server will re-calc)
         const orderRes = await fetch('/api/orders', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
            customer_name: name.trim(),
            customer_phone: phone.trim() || undefined,
            note: note.trim() || undefined,
            items: items.map((i) => ({
               product_id: i.product_id,
               qty: i.qty,
               options: {
               temp: i.temp ?? undefined,
               size: i.size?.code ?? undefined,
               },
            })),
         }),
         })
         const orderJson = await orderRes.json()
         if (!orderJson?.success) throw new Error(orderJson?.data?.message ?? 'Gagal membuat order')

         const order = orderJson.data.order

         // 2) create snap token (backend)
         const payRes = await fetch('/api/payments/midtrans', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ order_id: order.id }),
         })
         const payJson = await payRes.json()
         if (!payJson?.success) throw new Error(payJson?.data?.message ?? 'Gagal membuat payment')

         const { token } = payJson.data

         // 3) open snap popup
         if (!window.snap?.pay) throw new Error('Snap.js belum siap (client key belum benar?)')

         window.snap.pay(token, {
         onSuccess: () => {
            clear()
            router.push('/orders')
         },
         onPending: () => {
            clear()
            router.push('/orders')
         },
         onError: () => {
            setMsg('Pembayaran gagal. Coba lagi dari halaman Orders.')
         },
         onClose: () => {
            setMsg('Kamu menutup pembayaran. Kamu bisa bayar ulang dari halaman Orders.')
         },
         })
      } catch (e: any) {
         setMsg(e?.message ?? 'Terjadi kesalahan')
      } finally {
         setLoading(false)
      }
   }

   return (
      <AppShell title="Your Cart" onSearch={() => {}}>
         <MidtransSnapLoader />
         <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
         <div className="space-y-4">
            {items.length === 0 ? (
               <Card className="rounded-2xl">
               <CardContent className="p-6 text-sm text-muted-foreground">Cart kosong.</CardContent>
               </Card>
            ) : (
               items.map((it) => (
               <Card key={it.key} className="rounded-2xl">
                  <CardContent className="p-4 flex items-start justify-between gap-3">
                     <div className="min-w-0">
                     <div className="font-semibold truncate">{it.name}</div>
                     <div className="text-xs text-muted-foreground">
                        {it.temp?.toUpperCase()} • {it.size?.code ?? '—'} • {rupiah(it.unit_price_idr)}
                     </div>
                     <button className="mt-2 text-xs text-red-500 hover:underline" onClick={() => removeItem(it.key)}>
                        Remove
                     </button>
                     </div>

                     <div className="w-28 text-right">
                     <Input
                        className="h-9 rounded-xl text-center"
                        type="number"
                        min={1}
                        value={it.qty}
                        onChange={(e) => setQty(it.key, Number(e.target.value))}
                     />
                     <div className="mt-2 text-sm font-semibold">{rupiah(it.line_total_idr)}</div>
                     </div>
                  </CardContent>
               </Card>
               ))
            )}
         </div>

         <div className="space-y-4">
            <Card className="rounded-2xl">
               <CardContent className="p-4 space-y-3">
               <div className="font-semibold">Checkout</div>

               <Input className="rounded-xl" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
               <Input className="rounded-xl" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
               <Input className="rounded-xl" placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />

               <Separator />

               <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{rupiah(subtotal)}</span>
               </div>

               {msg && <div className="text-sm text-red-500">{msg}</div>}

               <Button className="w-full rounded-xl" disabled={loading || items.length === 0} onClick={checkout}>
                  {loading ? 'Processing…' : 'Create Order & Pay'}
               </Button>

               <div className="text-[11px] text-muted-foreground">
                  Payment menggunakan Midtrans Snap sandbox.
               </div>
               </CardContent>
            </Card>
         </div>
         </div>
      </AppShell>
   )
}
