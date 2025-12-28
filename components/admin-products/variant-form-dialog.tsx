'use client'

import * as React from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

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

const Schema = z.object({
   code: z.string().min(1).max(20),
   label: z.string().min(1).max(50),
   price_delta_idr: z.number().int().min(-100000).max(100000),
   sort_order: z.number().int().min(0),
   is_default: z.boolean(),
   is_active: z.boolean(),
})

export function VariantFormDialog({
   open,
   onOpenChange,
   productId,
   initial,
   onSaved,
}: {
   open: boolean
   onOpenChange: (v: boolean) => void
   productId: string
   initial: Variant | null
   onSaved: () => void
}) {
   const isEdit = !!initial?.id
   const [loading, setLoading] = React.useState(false)
   const [error, setError] = React.useState<string | null>(null)

   const [code, setCode] = React.useState('')
   const [label, setLabel] = React.useState('')
   const [delta, setDelta] = React.useState(0)
   const [sort, setSort] = React.useState(0)
   const [isDefault, setIsDefault] = React.useState(false)
   const [isActive, setIsActive] = React.useState(true)

   React.useEffect(() => {
      if (!open) return
      setError(null)
      setLoading(false)

      setCode(initial?.code ?? '')
      setLabel(initial?.label ?? '')
      setDelta(initial?.price_delta_idr ?? 0)
      setSort(initial?.sort_order ?? 0)
      setIsDefault(initial?.is_default ?? false)
      setIsActive(initial?.is_active ?? true)
   }, [open, initial])

   const submit = async () => {
      setError(null)
      setLoading(true)
      try {
         const payload = {
         code: code.trim(),
         label: label.trim(),
         price_delta_idr: Number(delta),
         sort_order: Number(sort),
         is_default: isDefault,
         is_active: isActive,
         }
         const parsed = Schema.safeParse(payload)
         if (!parsed.success) throw new Error('Invalid input')

         const res = await fetch(isEdit ? `/api/admin/variants/${initial!.id}` : '/api/admin/variants', {
         method: isEdit ? 'PATCH' : 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(isEdit ? parsed.data : { product_id: productId, ...parsed.data }),
         })
         const json = await res.json().catch(() => null)
         if (!json?.success) throw new Error(json?.data?.message ?? 'Failed to save variant')

         onSaved()
      } catch (e: any) {
         setError(e?.message ?? 'Error')
      } finally {
         setLoading(false)
      }
   }

   return (
      <Dialog open={open} onOpenChange={onOpenChange}>
         <DialogContent className="rounded-2xl">
         <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Variant' : 'Add Variant'}</DialogTitle>
            <DialogDescription>Example: S / M / L with price delta.</DialogDescription>
         </DialogHeader>

         <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
               <div className="space-y-2">
               <Label>Code</Label>
               <Input className="rounded-xl" value={code} onChange={(e) => setCode(e.target.value)} placeholder="M" />
               </div>
               <div className="space-y-2">
               <Label>Label</Label>
               <Input className="rounded-xl" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Medium" />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="space-y-2">
               <Label>Price delta (IDR)</Label>
               <Input className="rounded-xl" type="number" value={delta} onChange={(e) => setDelta(Number(e.target.value))} />
               </div>
               <div className="space-y-2">
               <Label>Sort order</Label>
               <Input className="rounded-xl" type="number" min={0} value={sort} onChange={(e) => setSort(Number(e.target.value))} />
               </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border p-3">
               <div>
               <div className="text-sm font-medium">Default</div>
               <div className="text-xs text-muted-foreground">Only one default per product.</div>
               </div>
               <Switch checked={isDefault} onCheckedChange={setIsDefault} />
            </div>

            <div className="flex items-center justify-between rounded-2xl border p-3">
               <div>
               <div className="text-sm font-medium">Active</div>
               <div className="text-xs text-muted-foreground">Inactive variants won’t show.</div>
               </div>
               <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            {error && <div className="text-sm text-red-500">{error}</div>}

            <Button className="w-full rounded-xl" onClick={submit} disabled={loading}>
               {loading ? 'Saving…' : 'Save'}
            </Button>
         </div>
         </DialogContent>
      </Dialog>
   )
}
