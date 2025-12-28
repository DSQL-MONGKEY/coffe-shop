'use client'

import * as React from 'react'
import { z } from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Category = {
   id: string
   name: string
   slug: string
   sort_order: number
   is_active: boolean
}

const Schema = z.object({
   name: z.string().min(1).max(60),
   slug: z.string().min(1).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
   sort_order: z.number().int().min(0).max(999),
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

export function CategoryFormDialog({
   open,
   onOpenChange,
   initial,
   onSaved,
}: {
   open: boolean
   onOpenChange: (v: boolean) => void
   initial: Category | null
   onSaved: () => void
}) {
   const isEdit = !!initial?.id
   const [loading, setLoading] = React.useState(false)
   const [error, setError] = React.useState<string | null>(null)

   const [name, setName] = React.useState('')
   const [slug, setSlug] = React.useState('')
   const [sortOrder, setSortOrder] = React.useState<number>(0)
   const [active, setActive] = React.useState(true)

   React.useEffect(() => {
      if (!open) return
      setError(null)
      setLoading(false)

      setName(initial?.name ?? '')
      setSlug(initial?.slug ?? '')
      setSortOrder(initial?.sort_order ?? 0)
      setActive(initial?.is_active ?? true)
   }, [open, initial])

   const autoSlug = () => setSlug(slugify(name))

   const submit = async () => {
      setError(null)
      setLoading(true)
      try {
         const payload = {
            name: name.trim(),
            slug: slug.trim(),
            sort_order: Number(sortOrder),
            is_active: !!active,
         }

         const parsed = Schema.safeParse(payload)
         if (!parsed.success) throw new Error('Invalid input')

         const res = await fetch(isEdit ? `/api/admin/categories/${initial!.id}` : '/api/admin/categories', {
            method: isEdit ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed.data),
         })
         const json = await res.json().catch(() => null)
         if (!json?.success) throw new Error(json?.data?.message ?? 'Failed to save category')

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
            <DialogTitle>{isEdit ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>Keep it short and consistent (slug used in URLs).</DialogDescription>
         </DialogHeader>

         <div className="space-y-4">
            <div className="space-y-2">
               <Label>Name</Label>
               <Input className="rounded-xl" value={name} onChange={(e) => setName(e.target.value)} placeholder="Coffee" />
            </div>

            <div className="space-y-2">
               <div className="flex items-center justify-between">
               <Label>Slug</Label>
               <button type="button" className="text-xs text-muted-foreground hover:underline" onClick={autoSlug}>
                  Auto
               </button>
               </div>
               <Input className="rounded-xl" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="coffee" />
            </div>

            <div className="grid grid-cols-2 gap-3">
               <div className="space-y-2">
               <Label>Sort order</Label>
               <Input
                  className="rounded-xl"
                  type="number"
                  min={0}
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
               />
               </div>
               <div className="space-y-2">
               <Label>Active</Label>
               <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl"
                  onClick={() => setActive((v) => !v)}
               >
                  {active ? 'Yes' : 'No'}
               </Button>
               </div>
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
