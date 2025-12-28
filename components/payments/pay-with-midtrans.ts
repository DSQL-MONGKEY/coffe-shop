export async function payOrderWithMidtrans(orderId: string) {
   const res = await fetch('/api/payments/midtrans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId }),
   })
   const json = await res.json().catch(() => null)
   if (!json?.success) throw new Error(json?.data?.message ?? 'Failed to create payment')
   const token = json.data.token as string
   
   if (!window.snap?.pay) throw new Error('Snap.js not loaded')
   return new Promise<void>((resolve, reject) => {
      // @ts-expect-error global snap
      window.snap.pay(token, {
         onSuccess: () => resolve(),
         onPending: () => resolve(),
         onError: () => reject(new Error('Payment failed')),
         onClose: () => resolve(),
      })
   })
}
