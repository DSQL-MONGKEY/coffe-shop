import { Suspense } from 'react'
import AdminGate from './admin-gate'


function AdminLoading() {
   return (
      <div className="min-h-svh grid place-items-center p-6">
         <div className="rounded-2xl border bg-background/80 backdrop-blur p-4 text-sm text-muted-foreground">
            Loading admin authorization…
         </div>
      </div>
   )
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
   return <Suspense fallback={<AdminLoading />}>
      <AdminGate>{children}</AdminGate>
   </Suspense>
}
