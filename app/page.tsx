'use client'

import * as React from 'react'
import { AppShell } from '@/components/app-shell/app-shell'
import { CatalogPage } from '@/components/shop/catalog-page'

export default function HomePage() {
  const [search, setSearch] = React.useState('')

  return (
    <AppShell title="Coffee Catalog" onSearch={setSearch}>
      <CatalogPage search={search} />
    </AppShell>
  )
}
