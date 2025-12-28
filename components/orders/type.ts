export type OrderStatus =
   | 'pending_payment'
   | 'paid'
   | 'preparing'
   | 'ready'
   | 'completed'
   | 'cancelled'

export type Payment = {
   status?: 'pending' | 'paid' | 'failed'
   method?: string | null
   paid_at?: string | null
   gross_amount_idr?: number | null
}

export type OrderListItem = {
   id: string
   user_id?: string
   order_no: string
   status: OrderStatus
   total_idr: number
   customer_name?: string | null
   created_at: string
   payment?: Payment | null
}

export type OrderDetail = any