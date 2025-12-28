'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingBag } from 'lucide-react'
import { ProductSheet } from './product-sheet'
import { useState } from 'react'

type Variant = { 
   code: string; 
   label: string; 
   price_delta_idr: number; 
   is_default: boolean; 
   sort_order: number 
}
type Product = {
   id: string
   name: string
   description: string | null
   price_idr: number
   variants: Variant[]
}

function rupiah(n: number) {
   return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n)
}

function minPrice(p: Product) {
   if (!p.variants?.length) return p.price_idr
   const deltas = p.variants.map((v) => v.price_delta_idr ?? 0)
   return p.price_idr + Math.min(...deltas)
}

export function ProductCard({ product }: { product: Product }) {
   const [open, setOpen] = useState(false)
   const priceFrom = minPrice(product)

   return (
      <>
         <Card className="rounded-2xl overflow-hidden border bg-background/80 backdrop-blur">
            <CardContent className="p-4 space-y-3">
               <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                     <div className="font-semibold tracking-tight truncate">{product.name}</div>
                     <div className="text-xs text-muted-foreground line-clamp-2">
                     {product.description || 'Signature menu with fresh ingredients.'}
                     </div>
                  </div>
                  <Badge className="rounded-full bg-amber-100 text-stone-900 dark:bg-amber-950/40 dark:text-stone-50">
                     {rupiah(priceFrom)}
                  </Badge>
               </div>

               {product.variants?.length ? (
                  <div className="flex flex-wrap gap-2">
                     {product.variants.slice(0, 3).map((v) => (
                     <Badge key={v.code} variant="secondary" className="rounded-full">
                        {v.code}
                     </Badge>
                     ))}
                     {product.variants.length > 3 && (
                     <Badge variant="secondary" className="rounded-full">
                        +{product.variants.length - 3}
                     </Badge>
                     )}
                  </div>
               ) : (
                  <div className="text-xs text-muted-foreground">No variants</div>
               )}

               <Button className="w-full rounded-xl gap-2" variant="outline" onClick={() => setOpen(true)}>
                  <ShoppingBag className="h-4 w-4" />
                  View / Add to cart
               </Button>
            </CardContent>
         </Card>

         <ProductSheet open={open} onOpenChange={setOpen} product={product} />
      </>
   )
}
