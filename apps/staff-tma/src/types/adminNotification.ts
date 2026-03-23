export type AdminNotificationType = 'ORDER_CREATED' | 'CUSTOMER_MESSAGE';

export interface AdminNotification {
  id: string;
  type: AdminNotificationType;
  title: string;
  body: string;
  order_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_username?: string;
  customer_telegram_id?: number;
  payload?: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export interface AdminNotificationFilters {
  page?: number;
  page_size?: number;
  type?: '' | AdminNotificationType;
  is_read?: boolean;
}

export interface AdminNotificationListResponse {
  items: AdminNotification[];
  total: number;
}
