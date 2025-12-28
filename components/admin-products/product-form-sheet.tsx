'use client'

import * as React from 'react'
import { z } from 'zod'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

type Category = { id: string; name: string }
type Product = {
   id: string
   category_id: string | null
   name: string
   slug: string
   description: string | null
   price_idr: number
   image_path: string | null
   is_active: boolean
}

const Schema = z.object({
   category_id: z.string().uuid().nullable(),
   name: z.string().min(1),
   slug: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
   description: z.string().max(500).nullable(),
   price_idr: z.number().int().min(0),
   image_path: z.string().max(500).nullable(),
   is_active: z.boolean(),
})

function slugify(input: string) {
   return input
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
}

export function ProductFormSheet({
   open,
   onOpenChange,
   categories,
   initial,
   onSaved,
}: {
   open: boolean
   onOpenChange: (v: boolean) => void
   categories: Category[]
   initial: Product | null
   onSaved: () => void
}) {
   const isEdit = !!initial?.id
   const [loading, setLoading] = React.useState(false)
   const [error, setError] = React.useState<string | null>(null)

   const [categoryId, setCategoryId] = React.useState<string>('none')
   const [name, setName] = React.useState('')
   const [slug, setSlug] = React.useState('')
   const [description, setDescription] = React.useState('')
   const [price, setPrice] = React.useState<number>(0)
   const [isActive, setIsActive] = React.useState(true)

   React.useEffect(() => {
      if (!open) return
      setError(null)
      setLoading(false)

      setCategoryId(initial?.category_id ?? 'none')
      setName(initial?.name ?? '')
      setSlug(initial?.slug ?? '')
      setDescription(initial?.description ?? '')
      setPrice(initial?.price_idr ?? 0)
      setIsActive(initial?.is_active ?? true)
   }, [open, initial])

   const autoSlug = () => setSlug(slugify(name))

   const submit = async () => {
      setError(null)
      setLoading(true)
      try {
         const payload = {
         category_id: categoryId === 'none' ? null : categoryId,
         name,
         slug,
         description: description ? description : null,
         price_idr: Number(price),
         image_path: null,
         is_active: isActive,
         }

         const parsed = Schema.safeParse(payload)
         if (!parsed.success) throw new Error('Invalid input')

         const res = await fetch(isEdit ? `/api/admin/products/${initial!.id}` : '/api/admin/products', {
         method: isEdit ? 'PATCH' : 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(parsed.data),
         })
         const json = await res.json().catch(() => null)
         if (!json?.success) throw new Error(json?.data?.message ?? 'Failed to save')

         onSaved()
      } catch (e: any) {
         setError(e?.message ?? 'Error')
      } finally {
         setLoading(false)
      }
   }

   return (
      <Sheet open={open} onOpenChange={onOpenChange}>
         <SheetContent side="right" className="w-full sm:max-w-[480px] rounded-l-3xl p-5">
         <SheetHeader>
            <SheetTitle className="tracking-tight">{isEdit ? 'Edit Product' : 'Add Product'}</SheetTitle>
            <SheetDescription>Set base info. Variants can be managed in product card.</SheetDescription>
         </SheetHeader>

         <div className="mt-4 space-y-4">
            <div className="space-y-2">
               <Label>Category</Label>
               <Select value={categoryId} onValueChange={setCategoryId}>
               <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select category" />
               </SelectTrigger>
               <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map((c) => (
                     <SelectItem key={c.id} value={c.id}>
                     {c.name}
                     </SelectItem>
                  ))}
               </SelectContent>
               </Select>
            </div>

            <div className="space-y-2">
               <Label>Name</Label>
               <Input className="rounded-xl" value={name} onChange={(e) => setName(e.target.value)} placeholder="Vanilla Latte" />
            </div>

            <div className="space-y-2">
               <div className="flex items-center justify-between">
               <Label>Slug</Label>
               <button className="text-xs text-muted-foreground hover:underline" onClick={autoSlug} type="button">
                  Auto
               </button>
               </div>
               <Input className="rounded-xl" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="vanilla-latte" />
            </div>

            <div className="space-y-2">
               <Label>Description</Label>
               <Textarea className="rounded-xl min-h-[90px]" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="space-y-2">
               <Label>Base price (IDR)</Label>
               <Input className="rounded-xl" type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            </div>

            <div className="flex items-center justify-between rounded-2xl border p-3">
               <div>
               <div className="text-sm font-medium">Active</div>
               <div className="text-xs text-muted-foreground">Inactive products won’t show in catalog.</div>
               </div>
               <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            {error && <div className="text-sm text-red-500">{error}</div>}

            <Button className="w-full rounded-xl" onClick={submit} disabled={loading}>
               {loading ? 'Saving…' : 'Save'}
            </Button>
         </div>
         </SheetContent>
      </Sheet>
   )
}
