'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useMe } from '@/components/app-shell/use-me'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { ProductFormSheet } from '@/components/admin-products/product-form-sheet'
import { VariantsManager } from '@/components/admin-products/variants-manager'
import { Plus, Pencil, Trash2 } from 'lucide-react'

type Category = { id: string; name: string; slug: string }
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

function rupiah(n: number) {
   return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

export function AdminProductsPage() {
   const router = useRouter()
   const { me, loading: meLoading } = useMe()

   const [categories, setCategories] = React.useState<Category[]>([])
   const [products, setProducts] = React.useState<Product[]>([])
   const [loading, setLoading] = React.useState(true)
   const [msg, setMsg] = React.useState<string | null>(null)

   const [q, setQ] = React.useState('')
   const [categoryId, setCategoryId] = React.useState<string>('all')

   const [sheetOpen, setSheetOpen] = React.useState(false)
   const [editing, setEditing] = React.useState<Product | null>(null)

   // guard admin
   React.useEffect(() => {
      if (meLoading) return
      if (!me) router.push('/auth/login')
      else if (me.role !== 'admin') router.push('/')
   }, [me, meLoading, router])

   const loadCategories = React.useCallback(async () => {
      const res = await fetch('/api/admin/categories', { cache: 'no-store' })
      const json = await res.json().catch(() => null)
      if (json?.success) setCategories(json.data.categories ?? [])
   }, [])

   const loadProducts = React.useCallback(async () => {
      setLoading(true)
      setMsg(null)

      const qs = new URLSearchParams()
      if (q.trim()) qs.set('q', q.trim())
      if (categoryId !== 'all') qs.set('category_id', categoryId)

      const res = await fetch(`/api/admin/products?${qs.toString()}`, { cache: 'no-store' })
      const json = await res.json().catch(() => null)

      if (!json?.success) {
         setMsg(json?.data?.message ?? 'Failed to load products')
         setProducts([])
      } else {
         setProducts(json.data.products ?? [])
      }
      setLoading(false)
   }, [q, categoryId])

   React.useEffect(() => {
      loadCategories()
   }, [loadCategories])

   React.useEffect(() => {
      const t = setTimeout(() => loadProducts(), 250)
      return () => clearTimeout(t)
   }, [loadProducts])

   const openCreate = () => {
      setEditing(null)
      setSheetOpen(true)
   }
   const openEdit = (p: Product) => {
      setEditing(p)
      setSheetOpen(true)
   }

   const deleteProduct = async (id: string) => {
      setMsg(null)
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => null)
      if (!json?.success) return setMsg(json?.data?.message ?? 'Failed to delete product')
      await loadProducts()
   }

   return (
      <div className="space-y-5">
         {/* Header */}
         <div className="flex items-start justify-between gap-3">
         <div>
            <h2 className="text-xl font-semibold tracking-tight">Products</h2>
            <p className="text-sm text-muted-foreground">Manage catalog, pricing, and variants.</p>
         </div>
         <Button className="rounded-xl gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add product
         </Button>
         </div>

         {/* Filters */}
         <Card className="rounded-2xl bg-background/80 backdrop-blur">
         <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center">
            <Input
               className="rounded-xl"
               placeholder="Search name / slug…"
               value={q}
               onChange={(e) => setQ(e.target.value)}
            />

            <Select value={categoryId} onValueChange={setCategoryId}>
               <SelectTrigger className="rounded-xl md:w-[240px]">
               <SelectValue placeholder="Category" />
               </SelectTrigger>
               <SelectContent>
               <SelectItem value="all">All categories</SelectItem>
               {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                     {c.name}
                  </SelectItem>
               ))}
               </SelectContent>
            </Select>

            <div className="text-xs text-muted-foreground md:ml-auto">
               {loading ? 'Loading…' : `${products.length} products`}
            </div>
         </CardContent>
         </Card>

         {msg && <div className="rounded-2xl border bg-background p-3 text-sm text-red-500">{msg}</div>}

         {/* List */}
         {loading ? (
         <div className="text-sm text-muted-foreground">Loading…</div>
         ) : products.length === 0 ? (
         <div className="rounded-2xl border bg-background p-6 text-sm text-muted-foreground">No products.</div>
         ) : (
         <div className="grid gap-4 lg:grid-cols-2">
            {products.map((p) => (
               <Card key={p.id} className="rounded-2xl bg-background/80 backdrop-blur">
               <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                     <div className="min-w-0">
                     <div className="flex items-center gap-2">
                        <div className="font-semibold truncate">{p.name}</div>
                        {!p.is_active && <Badge variant="secondary" className="rounded-full">Inactive</Badge>}
                     </div>
                     <div className="text-xs text-muted-foreground truncate">
                        /{p.slug} • Base: <span className="font-medium">{rupiah(p.price_idr)}</span>
                     </div>
                     {p.description && <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.description}</div>}
                     </div>

                     <div className="flex items-center gap-2">
                     <Button variant="outline" size="icon" className="rounded-xl" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                     </Button>

                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive" size="icon" className="rounded-xl">
                           <Trash2 className="h-4 w-4" />
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl">
                           <AlertDialogHeader>
                           <AlertDialogTitle>Delete product?</AlertDialogTitle>
                           <AlertDialogDescription>
                              This will delete the product and its variants.
                           </AlertDialogDescription>
                           </AlertDialogHeader>
                           <AlertDialogFooter>
                           <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                           <AlertDialogAction className="rounded-xl" onClick={() => deleteProduct(p.id)}>
                              Delete
                           </AlertDialogAction>
                           </AlertDialogFooter>
                        </AlertDialogContent>
                     </AlertDialog>
                     </div>
                  </div>

                  <Separator />

                  {/* Variants manager inline */}
                  <VariantsManager productId={p.id} basePriceIdr={p.price_idr} />

               </CardContent>
               </Card>
            ))}
         </div>
         )}

         {/* Create/Edit Sheet */}
         <ProductFormSheet
         open={sheetOpen}
         onOpenChange={setSheetOpen}
         categories={categories}
         initial={editing}
         onSaved={async () => {
            setSheetOpen(false)
            await loadProducts()
         }}
         />
      </div>
   )
}