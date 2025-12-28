'use client'

import * as React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Minus, Plus, ShoppingBag } from 'lucide-react'
import { useCart, type CartTemp } from '@/stores/cart'

type Variant = {
   code: string
   label: string
   price_delta_idr: number
   is_default: boolean
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

function computePrice(base: number, delta?: number) {
   return Math.max(0, base + (delta ?? 0))
}

export function ProductSheet({
   open,
   onOpenChange,
   product,
}: {
   open: boolean
   onOpenChange: (v: boolean) => void
   product: Product
}) {
   const addItem = useCart((s) => s.addItem)

   const defaultVariant =
      product.variants?.find((v) => v.is_default) ?? (product.variants?.length ? product.variants[0] : null)

   const [qty, setQty] = React.useState(1)
   const [temp, setTemp] = React.useState<CartTemp>('ice')
   const [variant, setVariant] = React.useState<Variant | null>(defaultVariant)

   React.useEffect(() => {
      // reset tiap buka sheet untuk UX
      if (open) {
         setQty(1)
         setTemp('ice')
         setVariant(defaultVariant)
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [open, product.id])

   const unit = computePrice(product.price_idr, variant?.price_delta_idr ?? 0)
   const total = unit * qty

   const doAdd = () => {
      addItem({
         product_id: product.id,
         name: product.name,
         base_price_idr: product.price_idr,
         qty,
         temp,
         size: variant ? { code: variant.code, label: variant.label, price_delta_idr: variant.price_delta_idr } : null,
         unit_price_idr: unit,
      })
      onOpenChange(false)
   }

   return (
      <Sheet open={open} onOpenChange={onOpenChange}>
         <SheetContent side="bottom" className="rounded-t-3xl p-5">
         <SheetHeader className="space-y-1">
            <SheetTitle className="tracking-tight">{product.name}</SheetTitle>
            <SheetDescription className="text-sm">
               {product.description ?? 'Freshly brewed with love.'}
            </SheetDescription>
         </SheetHeader>

         <div className="mt-4 space-y-5">
            {/* Price */}
            <div className="flex items-center justify-between">
               <div className="text-sm text-muted-foreground">Price</div>
               <Badge className="rounded-full bg-amber-100 text-stone-900 dark:bg-amber-950/40 dark:text-stone-50">
               {rupiah(unit)}
               </Badge>
            </div>

            {/* Temp toggle */}
            <div className="space-y-2">
               <div className="text-sm font-medium">Temperature</div>
               <div className="flex gap-2">
               <Button
                  type="button"
                  variant={temp === 'hot' ? 'default' : 'outline'}
                  className="rounded-xl"
                  onClick={() => setTemp('hot')}
               >
                  Hot
               </Button>
               <Button
                  type="button"
                  variant={temp === 'ice' ? 'default' : 'outline'}
                  className="rounded-xl"
                  onClick={() => setTemp('ice')}
               >
                  Ice
               </Button>
               </div>
            </div>

            {/* Variants */}
            {product.variants?.length > 0 && (
               <div className="space-y-2">
               <div className="text-sm font-medium">Size</div>
               <div className="grid grid-cols-3 gap-2">
                  {product.variants.map((v) => {
                     const selected = variant?.code === v.code
                     const price = computePrice(product.price_idr, v.price_delta_idr)
                     return (
                     <button
                        key={v.code}
                        onClick={() => setVariant(v)}
                        className={[
                           'rounded-2xl border px-3 py-2 text-left transition',
                           selected ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/25' : 'hover:bg-muted/60',
                        ].join(' ')}
                        type="button"
                     >
                        <div className="text-sm font-semibold">{v.code}</div>
                        <div className="text-[11px] text-muted-foreground">{rupiah(price)}</div>
                     </button>
                     )
                  })}
               </div>
               </div>
            )}

            <Separator />

            {/* Qty + Add */}
            <div className="flex items-center justify-between gap-3">
               <div className="flex items-center gap-2">
               <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
               >
                  <Minus className="h-4 w-4" />
               </Button>
               <div className="w-10 text-center font-semibold">{qty}</div>
               <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl"
                  onClick={() => setQty((q) => q + 1)}
               >
                  <Plus className="h-4 w-4" />
               </Button>
               </div>

               <Button className="rounded-xl gap-2" onClick={doAdd}>
               <ShoppingBag className="h-4 w-4" />
               Add • {rupiah(total)}
               </Button>
            </div>
         </div>
         </SheetContent>
      </Sheet>
   )
}
