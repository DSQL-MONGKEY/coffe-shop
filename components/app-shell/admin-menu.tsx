'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useMe } from '@/components/app-shell/use-me'
import { Shield, ChevronDown, Package, ReceiptText, Tags, Paperclip } from 'lucide-react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEffect, useState } from 'react'

type Props = { collapsed?: boolean }

const ADMIN_ITEMS = [
   { href: '/admin/orders', label: 'Orders', icon: ReceiptText },
   { href: '/admin/products', label: 'Products', icon: Package },
   { href: '/admin/categories', label: 'Categories', icon: Tags },
   { href: '/admin/reports', label: 'Reports', icon: Paperclip },
] as const

export function AdminMenu({ collapsed = false }: Props) {
   const pathname = usePathname()
   const { me } = useMe()

   const isAdmin = me?.role === 'admin'
   const anyActive = isAdmin && ADMIN_ITEMS.some((i) => pathname.startsWith(i.href))

   const [open, setOpen] = useState(false)

   // auto-open ketika masuk area /admin/* 
   useEffect(() => {
      if (!collapsed && anyActive) setOpen(true)
   }, [anyActive, collapsed])

   // setelah hooks aman dipanggil, baru boleh return
   if (!isAdmin) return null

   const activeItemClass =
      'bg-amber-100/70 text-stone-900 dark:bg-amber-950/35 dark:text-stone-50'
   const idleItemClass =
      'text-muted-foreground hover:bg-muted/60 hover:text-foreground'

   // Collapsed: tampilkan dropdown menu biar admin submenu tetap bisa diakses
   if (collapsed) {
      return (
         <DropdownMenu>
         <DropdownMenuTrigger asChild>
            <button
               className={cn(
               'w-full flex items-center justify-center rounded-xl px-3 py-2 transition',
               anyActive ? activeItemClass : idleItemClass
               )}
               aria-label="Admin menu"
               title="Admin"
            >
               <Shield className="h-5 w-5" />
            </button>
         </DropdownMenuTrigger>

         <DropdownMenuContent align="start" side="right" className="min-w-48 rounded-2xl">
            {ADMIN_ITEMS.map((it) => {
               const Icon = it.icon
               const active = pathname.startsWith(it.href)
               return (
               <DropdownMenuItem key={it.href} asChild>
                  <Link
                     href={it.href}
                     className={cn(
                     'flex items-center gap-2',
                     active && 'font-medium'
                     )}
                  >
                     <Icon className="h-4 w-4" />
                     {it.label}
                  </Link>
               </DropdownMenuItem>
               )
            })}
         </DropdownMenuContent>
         </DropdownMenu>
      )
   }

   // Expanded: Collapsible dropdown
   return (
      <Collapsible open={open} onOpenChange={setOpen}>
         <CollapsibleTrigger asChild>
         <button
            className={cn(
               'w-full flex items-center justify-between rounded-xl px-3 py-2 transition',
               anyActive ? activeItemClass : idleItemClass
            )}
            aria-expanded={open}
         >
            <span className="flex items-center gap-3">
               <Shield className="h-5 w-5" />
               <span className="text-sm font-medium">Admin</span>
            </span>
            <ChevronDown className={cn('h-4 w-4 transition', open && 'rotate-180')} />
         </button>
         </CollapsibleTrigger>

         <CollapsibleContent className="mt-1 space-y-1 pl-2">
         {ADMIN_ITEMS.map((it) => {
            const Icon = it.icon
            const active = pathname.startsWith(it.href)
            return (
               <Link key={it.href} href={it.href} className="block">
               <div
                  className={cn(
                     'flex items-center gap-3 rounded-xl px-3 py-2 transition',
                     active ? activeItemClass : idleItemClass
                  )}
               >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{it.label}</span>
               </div>
               </Link>
            )
         })}
         </CollapsibleContent>
      </Collapsible>
   )
}
