import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartTemp = 'hot' | 'ice'

export type CartItem = {
   key: string // productId|size|temp
   product_id: string
   name: string
   base_price_idr: number
   qty: number

   // selected options
   size?: { code: string; label: string; price_delta_idr: number } | null
   temp?: CartTemp | null

   // computed snapshot
   unit_price_idr: number
   line_total_idr: number
}

type CartState = {
   items: CartItem[]
   addItem: (input: Omit<CartItem, 'key' | 'line_total_idr'>) => void
   removeItem: (key: string) => void
   setQty: (key: string, qty: number) => void
   clear: () => void
   subtotal: () => number
   count: () => number
}

function makeKey(product_id: string, sizeCode?: string | null, temp?: string | null) {
   return [product_id, sizeCode ?? '-', temp ?? '-'].join('|')
}

function computeUnit(base: number, delta?: number | null) {
   return Math.max(0, base + (delta ?? 0))
}

export const useCart = create<CartState>()(
   persist(
      (set, get) => ({
         items: [],

         addItem: (input) =>
         set((state) => {
            const sizeCode = input.size?.code ?? null
            const temp = input.temp ?? null
            const key = makeKey(input.product_id, sizeCode, temp)
            const unit = computeUnit(input.base_price_idr, input.size?.price_delta_idr ?? 0)

            const existing = state.items.find((it) => it.key === key)
            if (existing) {
               const nextQty = existing.qty + input.qty
               return {
               items: state.items.map((it) =>
                  it.key === key
                     ? {
                        ...it,
                        qty: nextQty,
                        unit_price_idr: unit,
                        line_total_idr: unit * nextQty,
                     }
                     : it
               ),
               }
            }

            const item: CartItem = {
               key,
               product_id: input.product_id,
               name: input.name,
               base_price_idr: input.base_price_idr,
               qty: input.qty,
               size: input.size ?? null,
               temp: input.temp ?? null,
               unit_price_idr: unit,
               line_total_idr: unit * input.qty,
            }

            return { items: [item, ...state.items] }
         }),

         removeItem: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),

         setQty: (key, qty) =>
         set((s) => {
            const safeQty = Math.max(1, Math.floor(qty))
            return {
               items: s.items.map((i) =>
               i.key === key ? { ...i, qty: safeQty, line_total_idr: i.unit_price_idr * safeQty } : i
               ),
            }
         }),

         clear: () => set({ items: [] }),

         subtotal: () => get().items.reduce((acc, i) => acc + i.line_total_idr, 0),
         count: () => get().items.reduce((acc, i) => acc + i.qty, 0),
      }),
      { name: 'coffee-shop:cart' }
   )
)
