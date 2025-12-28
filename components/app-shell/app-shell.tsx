'use client'

import { AppSidebar } from '@/components/app-shell/app-sidebar'
import { MobileNav } from '@/components/app-shell/mobile-nav'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { UserMenu } from './user-menu'
import { ReactNode, useEffect, useState } from 'react'

type Props = {
   children: ReactNode
   title?: string
   onSearch?: (q: string) => void
}

export function AppShell({ children, title = 'Catalog', onSearch }: Props) {
   const [collapsed, setCollapsed] = useState(false)
   const [q, setQ] = useState('')

   // persist collapse
   useEffect(() => {
      const v = localStorage.getItem('sidebar:collapsed')
      if (v) setCollapsed(v === '1')
   }, [])
   useEffect(() => {
      localStorage.setItem('sidebar:collapsed', collapsed ? '1' : '0')
   }, [collapsed])

   // debounce search
   useEffect(() => {
      if (!onSearch) return
      const t = setTimeout(() => onSearch(q.trim()), 250)
      return () => clearTimeout(t)
   }, [q, onSearch])

   return (
      <div className="min-h-svh bg-gradient-to-b from-background to-amber-50/40 dark:to-amber-950/15">
         <div className="flex">
         {/* Desktop sidebar */}
         <div className="hidden md:block">
            <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
         </div>

         {/* Main */}
         <div className="flex-1">
            {/* Topbar */}
            <header
               className={cn(
               'sticky top-0 z-20 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60',
               'px-4 md:px-6'
               )}
            >
               <div className="h-16 flex items-center gap-3">
               <MobileNav />

               <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                     <div className="hidden sm:block">
                     <h1 className="text-lg font-semibold tracking-tight text-stone-900 dark:text-stone-50">
                        {title}
                     </h1>
                     <p className="text-xs text-muted-foreground -mt-0.5">
                        Pickup only • Fresh & fast
                     </p>
                     </div>

                     <div className="flex-1">
                     <Input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Search coffee, tea, pastry…"
                        className="h-10 rounded-xl"
                     />
                     </div>
                  </div>
               </div>

               <div className="flex items-center gap-2">
                  <ThemeSwitcher />
                  <UserMenu />
               </div>
               </div>
            </header>

            <main className="px-4 md:px-6 py-6">
               {children}
            </main>
         </div>
         </div>
      </div>
   )
}
