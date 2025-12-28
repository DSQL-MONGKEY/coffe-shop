import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type Props = {
   title: string
   description: string
   children: React.ReactNode
}

export function AuthShell({ title, description, children }: Props) {
   return (
      <div className="min-h-svh w-full grid lg:grid-cols-2">
         {/* Left: coffee vibe hero */}
         <div className="hidden lg:flex relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-stone-50 to-amber-100" />
         <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />
         <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-stone-300/40 blur-3xl" />

         <div className="relative z-10 p-10 flex flex-col justify-between w-full">
            <div>
               <div className="inline-flex items-center gap-2 rounded-full border bg-white/60 px-3 py-1 text-sm">
               ☕ <span className="text-stone-700">Coffee Shop</span>
               <span className="text-stone-400">•</span>
               <span className="text-stone-600">Pickup only</span>
               </div>

               <h1 className="mt-6 text-4xl font-semibold tracking-tight text-stone-900">
               Fresh brews, fast pickup.
               </h1>
               <p className="mt-3 text-stone-600 max-w-md">
               Order your favorites, customize size & temperature, and pick up without hassle.
               </p>
            </div>

            <p className="text-sm text-stone-500">
               Order App • Website • 2024 Coffee Shop Inc.
            </p>
         </div>
         </div>

         {/* Right: form */}
         <div className="flex items-center justify-center p-6 md:p-10 bg-white">
         <div className="w-full max-w-md">
            <Card className="rounded-2xl">
               <CardHeader>
                  <CardTitle className="text-2xl">{title}</CardTitle>
                  <CardDescription>{description}</CardDescription>
               </CardHeader>
               <CardContent>{children}</CardContent>
            </Card>
            <p className="mt-4 text-xs text-stone-500 text-center">
               By continuing, you agree to our terms.
            </p>
         </div>
         </div>
      </div>
   )
}
