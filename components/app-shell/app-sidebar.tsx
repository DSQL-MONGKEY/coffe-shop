'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Coffee, LayoutGrid, ReceiptText, PanelLeftClose, PanelLeftOpen, ShoppingCart } from 'lucide-react'
import { AdminMenu } from './admin-menu'

type Props = {
   collapsed: boolean
   onToggle: () => void
}

const navItems = [
   { href: '/', label: 'Catalog', icon: LayoutGrid },
   { href: '/cart', label: 'Cart', icon: ShoppingCart },
   { href: '/orders', label: 'Orders', icon: ReceiptText },
]

function SidebarFallback({ collapsed, onToggle }: Props) {
  // fallback sederhana (no hooks runtime)
   return (
      <aside
         className={cn(
         'h-svh sticky top-0 border-r bg-background/80 backdrop-blur duration-300 ease-in-out',
         collapsed ? 'w-[72px]' : 'w-[260px]'
         )}
      >
         <div className="h-16 px-3 flex items-center justify-between">
         <Link href="/" className={cn('flex items-center gap-2', collapsed && 'justify-center w-full')}>
            <div className="h-9 w-9 rounded-2xl grid place-items-center border bg-amber-50 text-stone-900 dark:bg-amber-950/40 dark:text-stone-50">
               <Coffee className="h-5 w-5" />
            </div>
            {!collapsed && (
               <div className="leading-tight">
               <div className="font-semibold tracking-tight">Fresh Brew</div>
               <div className="text-xs text-muted-foreground"></div>
               </div>
            )}
         </Link>

         <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn('rounded-xl', collapsed && 'hidden')}
            aria-label="Toggle sidebar"
         >
            <PanelLeftClose className="h-5 w-5" />
         </Button>

         {collapsed && (
            <Button
               variant="ghost"
               size="icon"
               onClick={onToggle}
               className="rounded-xl"
               aria-label="Expand sidebar"
            >
               <PanelLeftOpen className="h-5 w-5" />
            </Button>
         )}
         </div>

         <Separator />

         <nav className="p-2 space-y-1">
         {navItems.map((it) => {
            const Icon = it.icon
            return (
               <Link key={it.href} href={it.href} className="block">
               <div
                  className={cn(
                     'flex items-center gap-3 rounded-xl px-3 py-2 transition',
                     'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                  title={collapsed ? it.label : undefined}
               >
                  <Icon className="h-5 w-5" />
                  {!collapsed && <span className="text-sm font-medium">{it.label}</span>}
               </div>
               </Link>
            )
         })}
         </nav>
      </aside>
   )
}

function AppSidebarInner({ collapsed, onToggle }: Props) {
   const pathname = usePathname()

   return (
      <aside
         className={cn(
         'h-svh sticky top-0 border-r bg-background/80 backdrop-blur duration-300 ease-in-out',
         collapsed ? 'w-[72px]' : 'w-[260px]'
         )}
      >
         <div className="h-16 px-3 flex items-center justify-between">
         <Link href="/" className={cn('flex items-center gap-2', collapsed && 'justify-center w-full')}>
            <div className="h-9 w-9 rounded-2xl grid place-items-center border bg-amber-50 text-stone-900 dark:bg-amber-950/40 dark:text-stone-50">
               <Coffee className="h-5 w-5" />
            </div>
            {!collapsed && (
               <div className="leading-tight">
               <div className="font-semibold tracking-tight">Fresh Brew</div>
               <div className="text-xs text-muted-foreground"></div>
               </div>
            )}
         </Link>

         <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={cn('rounded-xl', collapsed && 'hidden')}
            aria-label="Toggle sidebar"
         >
            <PanelLeftClose className="h-5 w-5" />
         </Button>

         {collapsed && (
            <Button
               variant="ghost"
               size="icon"
               onClick={onToggle}
               className="rounded-xl"
               aria-label="Expand sidebar"
            >
               <PanelLeftOpen className="h-5 w-5" />
            </Button>
         )}
         </div>

         <Separator />

         <nav className="p-2 space-y-1">
         {navItems.map((it) => {
            const active = it.href === '/' ? pathname === '/' : pathname.startsWith(it.href)
            const Icon = it.icon
            return (
               <Link key={it.href} href={it.href} className="block">
               <div
                  className={cn(
                     'flex items-center gap-3 rounded-xl px-3 py-2 transition',
                     active
                     ? 'bg-amber-100/70 text-stone-900 dark:bg-amber-950/35 dark:text-stone-50'
                     : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                  )}
                  title={collapsed ? it.label : undefined}
               >
                  <Icon className="h-5 w-5" />
                  {!collapsed && <span className="text-sm font-medium">{it.label}</span>}
               </div>
               </Link>
            )
         })}

         <AdminMenu collapsed={collapsed} />
         </nav>

         <div className="absolute bottom-0 left-0 right-0 p-3">
         <div className={cn('rounded-2xl border p-3 text-xs text-muted-foreground', collapsed && 'hidden')}>
            Tip: gunakan search untuk cepat cari menu.
         </div>
         </div>
      </aside>
   )
}

export function AppSidebar(props: Props) {
   return (
      <Suspense fallback={<SidebarFallback {...props} />}>
         <AppSidebarInner {...props} />
      </Suspense>
   )
}
