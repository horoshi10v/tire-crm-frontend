export type OrderStatus = 'NEW' | 'PREPAYMENT' | 'DONE' | 'CANCELLED';

export interface OrderItemResponse {
  lot_id: string;
  price: number;
  quantity: number;
  total: number;
}

export interface OrderResponse {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_username?: string;
  customer_telegram_id?: number;
  status: OrderStatus;
  total_amount: number;
  created_at: string;
  items: OrderItemResponse[];
}

export interface UpdateOrderStatusDTO {
  status: OrderStatus;
  comment?: string;
}

export interface SendOrderMessageDTO {
  message: string;
}

export type OrderMessageDirection = 'OUTBOUND' | 'INBOUND';

export interface OrderMessageResponse {
  id: string;
  order_id: string;
  customer_telegram_id: number;
  direction: OrderMessageDirection;
  message_text: string;
  telegram_message_id: number;
  reply_to_telegram_message_id?: number;
  created_at: string;
}
