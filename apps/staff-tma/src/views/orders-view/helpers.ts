import {
  createBuyerOrderMessage,
  formatMediumDateTime,
  formatMoney,
  formatShortDateTime,
  getLotLabel,
  getOrderSummary,
} from '@tire-crm/shared';
import type { LotInternalResponse } from '../../types/lot';
import type { OrderMessageResponse, OrderResponse, OrderStatus } from '../../types/order';

export { formatMoney, getLotLabel };

export const formatOrderDate = formatMediumDateTime;

export const formatMessageDate = formatShortDateTime;

export const getStatusBadgeClass = (status: OrderStatus): string => {
  switch (status) {
    case 'NEW':
      return 'bg-blue-500/20 text-blue-200 border border-blue-600/40';
    case 'PREPAYMENT':
      return 'bg-amber-500/20 text-amber-200 border border-amber-600/40';
    case 'DONE':
      return 'bg-emerald-500/20 text-emerald-200 border border-emerald-600/40';
    case 'CANCELLED':
      return 'bg-red-500/20 text-red-200 border border-red-600/40';
    default:
      return 'bg-gray-500/20 text-gray-200 border border-gray-600/40';
  }
};

export const orderSummary = getOrderSummary;

export const createOrderItemsSummary = (order: OrderResponse, lotMap: Map<string, LotInternalResponse>): string => {
  const summary = order.items
    .map((item) => {
      const lot = lotMap.get(item.lot_id);
      const lotLabel = getLotLabel(lot);
      return `${lotLabel} x${item.quantity}`;
    })
    .join(', ');

  return summary || `${order.items.length} позицій`;
};

export const createBuyerMessage = (order: OrderResponse, lotMap: Map<string, LotInternalResponse>): string => {
  return createBuyerOrderMessage(order, lotMap, formatMoney);
};

export const getOrderPhotoUrls = (order: OrderResponse, lotMap: Map<string, LotInternalResponse>): string[] => {
  const photos: string[] = [];

  for (const item of order.items) {
    const lot = lotMap.get(item.lot_id);
    const url = lot?.photos?.[0];
    if (url && !photos.includes(url)) {
      photos.push(url);
    }
    if (photos.length >= 3) {
      break;
    }
  }

  return photos;
};

export const getItemBasePrice = (lot?: LotInternalResponse): number | null => {
  if (!lot || typeof lot.sell_price !== 'number' || Number.isNaN(lot.sell_price)) {
    return null;
  }
  return lot.sell_price;
};

export const getItemDiscountAmount = (item: OrderResponse['items'][number], lot?: LotInternalResponse): number => {
  const basePrice = getItemBasePrice(lot);
  if (basePrice === null || item.price >= basePrice) {
    return 0;
  }
  return (basePrice - item.price) * item.quantity;
};

export const sortOrdersByDateDesc = (orders: OrderResponse[]): OrderResponse[] => {
  return [...orders].sort((a, b) => {
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();
    return bTime - aTime;
  });
};

export const countStatuses = (orders: OrderResponse[]): Record<OrderStatus, number> => {
  return orders.reduce<Record<OrderStatus, number>>(
    (acc, order) => {
      acc[order.status] += 1;
      return acc;
    },
    { NEW: 0, PREPAYMENT: 0, DONE: 0, CANCELLED: 0 },
  );
};

export const sortMessagesByDateAsc = (messages: OrderMessageResponse[]): OrderMessageResponse[] => {
  return [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
};
