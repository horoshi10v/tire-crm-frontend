import type { OrderChannel, OrderStatus } from '../../types/order';

export const orderStatusOptions: Array<{ value: OrderStatus; label: string }> = [
  { value: 'NEW', label: 'Нове' },
  { value: 'PREPAYMENT', label: 'Передплата' },
  { value: 'DONE', label: 'Завершене' },
  { value: 'CANCELLED', label: 'Скасоване' },
];

export const orderStatusLabels: Record<OrderStatus, string> = {
  NEW: 'Нове',
  PREPAYMENT: 'Передплата',
  DONE: 'Завершене',
  CANCELLED: 'Скасоване',
};

export const orderChannelLabels: Record<OrderChannel, string> = {
  ONLINE: 'Онлайн',
  OFFLINE: 'Офлайн',
};
