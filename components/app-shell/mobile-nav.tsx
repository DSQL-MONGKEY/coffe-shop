'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useMe } from '@/components/app-shell/use-me'
import { Coffee, LayoutGrid, ReceiptText, ShoppingCart, Shield } from 'lucide-react'

function MobileNavFallback() {
   return (
      <div className="h-12 w-full rounded-2xl border bg-background/80 backdrop-blur" />
   )
}

function MobileNavInner() {
   const pathname = usePathname()
   const { me } = useMe()

   const items = [
      { href: '/', label: 'Catalog', icon: LayoutGrid },
      { href: '/cart', label: 'Cart', icon: ShoppingCart },
      { href: '/orders', label: 'Orders', icon: ReceiptText },
   ]

   const adminItems = [
      { href: '/admin/orders', label: 'Admin Orders', icon: Shield },
      { href: '/admin/products', label: 'Admin Products', icon: Coffee },
   ]

   return (
      <div className="flex items-center gap-2 overflow-x-auto">
         {items.map((it) => {
         const active = it.href === '/' ? pathname === '/' : pathname.startsWith(it.href)
         const Icon = it.icon
         return (
            <Link
               key={it.href}
               href={it.href}
               className={cn(
               'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition whitespace-nowrap',
               active
                  ? 'bg-amber-100/70 text-stone-900 dark:bg-amber-950/35 dark:text-stone-50'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
               )}
            >
               <Icon className="h-4 w-4" />
               {it.label}
            </Link>
         )
         })}

         {me?.role === 'admin' && (
         <>
            <span className="mx-1 h-6 w-px bg-border" />
            {adminItems.map((it) => {
               const active = pathname.startsWith(it.href)
               const Icon = it.icon
               return (
               <Link
                  key={it.href}
                  href={it.href}
                  className={cn(
                     'inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition whitespace-nowrap',
                     active
                     ? 'bg-amber-100/70 text-stone-900 dark:bg-amber-950/35 dark:text-stone-50'
                     : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
               >
                  <Icon className="h-4 w-4" />
                  {it.label}
               </Link>
               )
            })}
         </>
         )}
      </div>
   )
   }

   export function MobileNav() {
   return (
      <Suspense fallback={<MobileNavFallback />}>
         <MobileNavInner />
      </Suspense>
   )
}
