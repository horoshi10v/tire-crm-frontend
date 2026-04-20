import type { LotLike } from '../lot';
import { getLotLabel } from '../lot';

export type OrderStatus = 'NEW' | 'PREPAYMENT' | 'DONE' | 'CANCELLED';
export type OrderChannel = 'ONLINE' | 'OFFLINE';

export type OrderItemLike = {
  id?: string;
  lot_id?: string;
  quantity: number;
  price: number;
  total_amount?: number;
};

export type OrderLike = {
  id?: string;
  customer_name: string;
  customer_phone?: string;
  customer_telegram_id?: number;
  channel: OrderChannel | string;
  status: OrderStatus | string;
  total_amount: number;
  created_at: string;
  items: OrderItemLike[];
};

export const orderStatusLabels: Record<string, string> = {
  NEW: 'Нове',
  PREPAYMENT: 'Передплата',
  DONE: 'Завершене',
  CANCELLED: 'Скасоване',
};

export const orderChannelLabels: Record<string, string> = {
  ONLINE: 'Онлайн',
  OFFLINE: 'Офлайн',
};

export const getOrderStatusLabel = (status: string): string => {
  return orderStatusLabels[status] ?? status;
};

export const getOrderChannelLabel = (channel: string): string => {
  return orderChannelLabels[channel] ?? channel;
};

export const getOrderStatusTone = (
  status: string,
): 'neutral' | 'info' | 'success' | 'warning' | 'danger' => {
  switch (status) {
    case 'DONE':
      return 'success';
    case 'CANCELLED':
      return 'danger';
    case 'PREPAYMENT':
      return 'warning';
    case 'NEW':
    default:
      return 'info';
  }
};

export const getOrderItemsCount = (order: OrderLike): number => {
  return order.items.reduce((acc, item) => acc + item.quantity, 0);
};

export const getOrderSummary = (order: OrderLike): string => {
  return `${getOrderItemsCount(order)} шт., ${order.items.length} позицій`;
};

export const createOrderItemsSummary = (
  order: OrderLike,
  lotMap: Map<string, LotLike>,
): string => {
  const summary = order.items
    .map((item) => {
      const lot = item.lot_id ? lotMap.get(item.lot_id) : undefined;
      return `${getLotLabel(lot)} x${item.quantity}`;
    })
    .join(', ');

  return summary || `${order.items.length} позицій`;
};

export const createBuyerOrderMessage = (
  order: OrderLike,
  lotMap: Map<string, LotLike>,
  formatMoney: (value: number) => string,
): string => {
  const itemsSummary = createOrderItemsSummary(order, lotMap);
  const statusLabel = getOrderStatusLabel(String(order.status));

  switch (order.status) {
    case 'PREPAYMENT':
      return [
        `Добрий день, ${order.customer_name}!`,
        `Ваше замовлення (${itemsSummary}) підтверджено.`,
        `Статус: ${statusLabel}. Сума до оплати: ${formatMoney(order.total_amount)} грн.`,
        'Очікуємо передплату. Якщо потрібні реквізити або консультація, напишіть у відповідь.',
      ].join('\n');
    case 'DONE':
      return [
        `Добрий день, ${order.customer_name}!`,
        `Ваше замовлення (${itemsSummary}) успішно завершено.`,
        `Підсумкова сума: ${formatMoney(order.total_amount)} грн.`,
        'Дякуємо за покупку. Якщо буде потрібна допомога або новий комплект, напишіть нам.',
      ].join('\n');
    case 'CANCELLED':
      return [
        `Добрий день, ${order.customer_name}!`,
        `Ваше замовлення (${itemsSummary}) скасовано.`,
        'Якщо хочете, ми можемо допомогти підібрати інший варіант.',
      ].join('\n');
    case 'NEW':
    default:
      return [
        `Добрий день, ${order.customer_name}!`,
        `Ваше замовлення (${itemsSummary}) зараз у статусі: ${statusLabel}.`,
        `Сума замовлення: ${formatMoney(order.total_amount)} грн.`,
        'Якщо є питання, напишіть у відповідь.',
      ].join('\n');
  }
};
