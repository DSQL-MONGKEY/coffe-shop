'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { LayoutGrid, ReceiptText, Shield, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMe } from '@/components/app-shell/use-me'

export function MobileNav() {
   const pathname = usePathname()
   const { me } = useMe()

   const items = [
      { href: '/', label: 'Catalog', icon: LayoutGrid },
      { href: '/orders', label: 'Orders', icon: ReceiptText },
      ...(me?.role === 'admin' ? [{ href: '/admin', label: 'Admin', icon: Shield }] : []),
   ]

   return (
      <div className="md:hidden">
         <Sheet>
         <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-xl" aria-label="Open menu">
               <Menu className="h-5 w-5" />
            </Button>
         </SheetTrigger>

         <SheetContent side="left" className="w-[300px]">
            <SheetHeader>
               <SheetTitle>Menu</SheetTitle>
            </SheetHeader>

            <div className="mt-4 space-y-2">
               {items.map((it) => {
               const active = pathname === it.href
               const Icon = it.icon
               return (
                  <Link key={it.href} href={it.href} className="block">
                     <div
                     className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2',
                        active ? 'bg-muted' : 'hover:bg-muted/60'
                     )}
                     >
                     <Icon className="h-5 w-5" />
                     <span className="text-sm font-medium">{it.label}</span>
                     </div>
                  </Link>
               )
               })}
            </div>
         </SheetContent>
         </Sheet>
      </div>
   )
}
