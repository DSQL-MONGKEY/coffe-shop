'use client'

import { AppShell } from '@/components/app-shell/app-shell'
import { AdminCategoriesPage } from '@/components/admin-categories/admin-categories-page'

export default function Page() {
   return (
      <AppShell title="Admin • Categories" onSearch={() => {}}>
         <AdminCategoriesPage />
      </AppShell>
   )
}
