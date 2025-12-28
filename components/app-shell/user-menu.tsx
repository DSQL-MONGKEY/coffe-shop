'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Lock, LogOut, Shield, User } from 'lucide-react'
import { useMe } from '@/components/app-shell/use-me'

function initials(nameOrEmail: string) {
   const s = nameOrEmail.trim()
   const parts = s.split(/\s+/).filter(Boolean)
   if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
   return s.slice(0, 2).toUpperCase()
}

export function UserMenu() {
   const router = useRouter()
   const { me, loading } = useMe()

   const signOut = async () => {
      await fetch('/api/auth/sign-out', { method: 'POST' })
      router.refresh()
   }

   if (loading) {
      return <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
   }

   if (!me) {
      return (
         <Button asChild variant="outline" className="rounded-xl">
         <Link href="/auth/login">Login</Link>
         </Button>
      )
   }

   const display = me.fullName || me.email || 'User'

   return (
      <DropdownMenu>
         <DropdownMenuTrigger asChild>
         <Button variant="ghost" className="rounded-xl px-2">
            <Avatar className="h-9 w-9">
               <AvatarFallback className="bg-amber-100 text-stone-900 dark:bg-amber-950/40 dark:text-stone-50">
               {initials(display)}
               </AvatarFallback>
            </Avatar>
         </Button>
         </DropdownMenuTrigger>

         <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="flex items-center gap-2">
               <User className="h-4 w-4" />
               <div className="min-w-0">
                  <div className="truncate">{display}</div>
                  <div className="text-xs text-muted-foreground truncate">{me.email}</div>
               </div>
            </DropdownMenuLabel>
         <DropdownMenuSeparator />
         <DropdownMenuLabel className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <div className="min-w-0">
               <div className="text-xs text-muted-foreground truncate">{me.role}</div>
            </div>
         </DropdownMenuLabel>
         <DropdownMenuSeparator />
         <DropdownMenuItem onClick={signOut} className="gap-2">
            <LogOut className="h-4 w-4" />
            Logout
         </DropdownMenuItem>
         </DropdownMenuContent>
      </DropdownMenu>
   )
}
