'use client'

import * as React from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { CategoryFormDialog } from '@/components/admin-categories/category-form-dialog'

type Category = {
   id: string
   name: string
   slug: string
   sort_order: number
   is_active: boolean
   created_at?: string
}

export function AdminCategoriesPage() {
   const [q, setQ] = React.useState('')
   const [loading, setLoading] = React.useState(true)
   const [msg, setMsg] = React.useState<string | null>(null)
   const [categories, setCategories] = React.useState<Category[]>([])

   const [open, setOpen] = React.useState(false)
   const [editing, setEditing] = React.useState<Category | null>(null)

   const load = React.useCallback(async () => {
      setLoading(true)
      setMsg(null)

      const qs = new URLSearchParams()
      if (q.trim()) qs.set('q', q.trim())

      const res = await fetch(`/api/admin/categories?${qs.toString()}`, { cache: 'no-store' })
      const json = await res.json().catch(() => null)

      if (!json?.success) {
         setMsg(json?.data?.message ?? 'Failed to load categories')
         setCategories([])
      } else {
         setCategories(json.data.categories ?? [])
      }

      setLoading(false)
   }, [q])

   React.useEffect(() => {
      const t = setTimeout(() => load(), 250)
      return () => clearTimeout(t)
   }, [load])

   const openCreate = () => {
      setEditing(null)
      setOpen(true)
   }
   const openEdit = (c: Category) => {
      setEditing(c)
      setOpen(true)
   }

   const del = async (id: string) => {
      setMsg(null)
      const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => null)
      if (!json?.success) return setMsg(json?.data?.message ?? 'Failed to delete')
      await load()
   }

   return (
      <div className="space-y-5">
         <div className="flex items-start justify-between gap-3">
         <div>
            <h2 className="text-xl font-semibold tracking-tight">Categories</h2>
            <p className="text-sm text-muted-foreground">Manage category grouping for your catalog.</p>
         </div>
         <Button className="rounded-xl gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add category
         </Button>
         </div>

         <Card className="rounded-2xl bg-background/80 backdrop-blur">
         <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center">
            <Input
               className="rounded-xl"
               placeholder="Search name / slug…"
               value={q}
               onChange={(e) => setQ(e.target.value)}
            />
            <div className="text-xs text-muted-foreground md:ml-auto">
               {loading ? 'Loading…' : `${categories.length} categories`}
            </div>
         </CardContent>
         </Card>

         {msg && <div className="rounded-2xl border bg-background p-3 text-sm text-red-500">{msg}</div>}

         <div className="rounded-2xl border bg-background/80 backdrop-blur overflow-hidden">
         <Table>
            <TableHeader>
               <TableRow>
               <TableHead>Name</TableHead>
               <TableHead>Slug</TableHead>
               <TableHead className="text-right">Sort</TableHead>
               <TableHead>Active</TableHead>
               <TableHead className="text-right">Action</TableHead>
               </TableRow>
            </TableHeader>

            <TableBody>
               {loading ? (
               <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                     Loading…
                  </TableCell>
               </TableRow>
               ) : categories.length === 0 ? (
               <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                     No categories.
                  </TableCell>
               </TableRow>
               ) : (
               categories.map((c) => (
                  <TableRow key={c.id}>
                     <TableCell className="font-medium">{c.name}</TableCell>
                     <TableCell className="text-muted-foreground">/{c.slug}</TableCell>
                     <TableCell className="text-right">{c.sort_order}</TableCell>
                     <TableCell className="text-muted-foreground">{c.is_active ? 'Yes' : 'No'}</TableCell>
                     <TableCell className="text-right">
                     <div className="inline-flex gap-2">
                        <Button
                           size="icon"
                           variant="outline"
                           className="rounded-xl"
                           onClick={() => openEdit(c)}
                           aria-label="Edit category"
                        >
                           <Pencil className="h-4 w-4" />
                        </Button>

                        <AlertDialog>
                           <AlertDialogTrigger asChild>
                           <Button
                              size="icon"
                              variant="destructive"
                              className="rounded-xl"
                              aria-label="Delete category"
                           >
                              <Trash2 className="h-4 w-4" />
                           </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent className="rounded-2xl">
                           <AlertDialogHeader>
                              <AlertDialogTitle>Delete category?</AlertDialogTitle>
                              <AlertDialogDescription>
                                 Pastikan category tidak dipakai, karena setiap produk yang masih memakai category ini bisa ikut terhapus.
                              </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                              <AlertDialogAction className="rounded-xl" onClick={() => del(c.id)}>
                                 Delete
                              </AlertDialogAction>
                           </AlertDialogFooter>
                           </AlertDialogContent>
                        </AlertDialog>
                     </div>
                     </TableCell>
                  </TableRow>
               ))
               )}
            </TableBody>
         </Table>
         </div>

         <CategoryFormDialog
         open={open}
         onOpenChange={setOpen}
         initial={editing}
         onSaved={async () => {
            setOpen(false)
            await load()
         }}
         />
      </div>
   )
}
