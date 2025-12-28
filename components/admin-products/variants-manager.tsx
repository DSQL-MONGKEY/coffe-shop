'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { VariantFormDialog } from '@/components/admin-products/variant-form-dialog'
import { Pencil, Plus, Trash2 } from 'lucide-react'

type Variant = {
   id: string
   product_id: string
   code: string
   label: string
   price_delta_idr: number
   is_default: boolean
   sort_order: number
   is_active: boolean
}

function rupiah(n: number) {
   return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export function VariantsManager({ productId, basePriceIdr }: { productId: string; basePriceIdr: number }) {
   const [variants, setVariants] = React.useState<Variant[]>([])
   const [loading, setLoading] = React.useState(true)
   const [msg, setMsg] = React.useState<string | null>(null)

   const [open, setOpen] = React.useState(false)
   const [editing, setEditing] = React.useState<Variant | null>(null)

   const load = React.useCallback(async () => {
      setLoading(true)
      setMsg(null)
      const res = await fetch(`/api/admin/variants?product_id=${productId}`, { cache: 'no-store' })
      const json = await res.json().catch(() => null)
      if (json?.success) setVariants(json.data.variants ?? [])
      else setMsg('Failed to load variants')
      setLoading(false)
   }, [productId])

   React.useEffect(() => {
      load()
   }, [load])

   const del = async (id: string) => {
      setMsg(null)
      const res = await fetch(`/api/admin/variants/${id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => null)
      if (!json?.success) return setMsg(json?.data?.message ?? 'Failed to delete variant')
      await load()
   }

   const openCreate = () => {
      setEditing(null)
      setOpen(true)
   }
   const openEdit = (v: Variant) => {
      setEditing(v)
      setOpen(true)
   }

   return (
      <div className="space-y-3">
         <div className="flex items-center justify-between">
         <div className="text-sm font-semibold">Variants</div>
         <Button variant="outline" className="rounded-xl gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add
         </Button>
         </div>

         {msg && <div className="text-xs text-red-500">{msg}</div>}

         {loading ? (
         <div className="text-xs text-muted-foreground">Loading variants…</div>
         ) : variants.length === 0 ? (
         <div className="text-xs text-muted-foreground">No variants yet. Add size variants (S/M/L).</div>
         ) : (
         <div className="space-y-2">
            {variants.map((v) => {
               const finalPrice = basePriceIdr + (v.price_delta_idr ?? 0)
               return (
               <div key={v.id} className="flex items-center justify-between gap-3 rounded-2xl border p-3">
                  <div className="min-w-0">
                     <div className="flex items-center gap-2">
                     <div className="font-semibold">{v.code}</div>
                     <div className="text-xs text-muted-foreground truncate">{v.label}</div>
                     {v.is_default && <Badge className="rounded-full" variant="secondary">Default</Badge>}
                     {!v.is_active && <Badge className="rounded-full" variant="secondary">Inactive</Badge>}
                     </div>
                     <div className="text-xs text-muted-foreground">
                     +{rupiah(v.price_delta_idr)} → <span className="font-medium">{rupiah(finalPrice)}</span>
                     </div>
                  </div>

                  <div className="flex items-center gap-2">
                     <Button size="icon" variant="outline" className="rounded-xl" onClick={() => openEdit(v)}>
                     <Pencil className="h-4 w-4" />
                     </Button>
                     <Button size="icon" variant="destructive" className="rounded-xl" onClick={() => del(v.id)}>
                     <Trash2 className="h-4 w-4" />
                     </Button>
                  </div>
               </div>
               )
            })}
         </div>
         )}

         <Separator />

         <VariantFormDialog
         open={open}
         onOpenChange={setOpen}
         productId={productId}
         initial={editing}
         onSaved={async () => {
            setOpen(false)
            await load()
         }}
         />
      </div>
   )
}
