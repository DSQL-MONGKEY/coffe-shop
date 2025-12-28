'use client'

import { AppShell } from '@/components/app-shell/app-shell'
import { AdminProductsPage } from '@/components/admin-products/admin-products-page'

export default function Page() {
   return (
      <AppShell title="Admin • Products" onSearch={() => {}}>
         <AdminProductsPage />
      </AppShell>
   )
}
