'use client'

import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { ProductCard } from './product-card'

type Category = { id: string; name: string; slug: string; sort_order: number }
type Variant = { code: string; label: string; price_delta_idr: number; is_default: boolean; sort_order: number }
type Product = {
   id: string
   category_id: string | null
   name: string
   slug: string
   description: string | null
   price_idr: number
   image_path: string | null
   variants: Variant[]
}

export function CatalogPage({ search }: { search: string }) {
   const [categories, setCategories] = React.useState<Category[]>([])
   const [selected, setSelected] = React.useState<string | null>(null)
   const [products, setProducts] = React.useState<Product[]>([])
   const [loadingCats, setLoadingCats] = React.useState(true)
   const [loadingProducts, setLoadingProducts] = React.useState(true)

   // fetch categories once
   React.useEffect(() => {
      let mounted = true
      ;(async () => {
         setLoadingCats(true)
         const res = await fetch('/api/categories', { cache: 'no-store' })
         const json = await res.json().catch(() => null)
         if (!mounted) return
         setCategories(json?.success ? (json.data.categories ?? []) : [])
         setLoadingCats(false)
      })()
      return () => {
         mounted = false
      }
   }, [])

   // fetch products when filter/search changes
   React.useEffect(() => {
      let mounted = true
      ;(async () => {
         setLoadingProducts(true)
         const qs = new URLSearchParams()
         if (search) qs.set('q', search)
         if (selected) qs.set('category', selected)
         const res = await fetch(`/api/products?${qs.toString()}`, { cache: 'no-store' })
         const json = await res.json().catch(() => null)
         if (!mounted) return
         setProducts(json?.success ? (json.data.products ?? []) : [])
         setLoadingProducts(false)
      })()
      return () => {
         mounted = false
      }
   }, [search, selected])

   return (
      <div className="space-y-6">
         {/* Category chips */}
         <section className="space-y-3">
         <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Categories</h2>
            {selected && (
               <button
                  className="text-xs text-muted-foreground hover:underline"
                  onClick={() => setSelected(null)}
               >
                  Clear filter
               </button>
            )}
         </div>

         <div className="flex gap-2 overflow-x-auto pb-1">
            {loadingCats ? (
               <>
                  <Skeleton className="h-8 w-24 rounded-full" />
                  <Skeleton className="h-8 w-28 rounded-full" />
                  <Skeleton className="h-8 w-20 rounded-full" />
               </>
            ) : (
               <>
               <Badge
                  className={cn(
                     'cursor-pointer rounded-full px-4 py-2',
                     selected === null ? 'bg-amber-100 text-stone-900 dark:bg-amber-950/40 dark:text-stone-50 hover:bg-amber-200 dark:hover:bg-amber-900' : 'bg-muted text-foreground hover:bg-white dark:hover:bg-slate-200/50'
                  )}
                  onClick={() => setSelected(null)}
               >
                  All
               </Badge>

               {categories.map((c) => (
                  <Badge
                     key={c.id}
                     className={cn(
                     'cursor-pointer rounded-full px-4 py-2',
                     selected === c.slug
                        ? 'bg-amber-100 text-stone-900 dark:bg-amber-950/40 dark:text-stone-50 hover:bg-amber-200 dark:hover:bg-amber-900'
                        : 'bg-muted text-foreground hover:bg-white dark:hover:bg-slate-200/50'
                     )}
                     onClick={() => setSelected(c.slug)}
                  >
                     {c.name}
                  </Badge>
               ))}
               </>
            )}
         </div>
         </section>

         {/* Products */}
         <section className="space-y-3">
         <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Menu</h2>
            <p className="text-xs text-muted-foreground">{loadingProducts ? 'Loading…' : `${products.length} items`}</p>
         </div>

         {loadingProducts ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
               {Array.from({ length: 8 }).map((_, i) => (
               <Skeleton key={i} className="h-44 rounded-2xl" />
               ))}
            </div>
         ) : products.length === 0 ? (
            <div className="rounded-2xl border bg-background p-6 text-sm text-muted-foreground">
               No products found. Try another keyword/category.
            </div>
         ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
               {products.map((p) => (
               <ProductCard key={p.id} product={p} />
               ))}
            </div>
         )}
         </section>
      </div>
   )
}
