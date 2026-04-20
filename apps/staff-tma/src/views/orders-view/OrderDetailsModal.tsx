import type { LotInternalResponse } from '../../types/lot';
import type { OrderMessageResponse, OrderResponse, OrderStatus } from '../../types/order';
import { orderChannelLabels, orderStatusLabels, orderStatusOptions } from './constants';
import {
  formatMessageDate,
  formatMoney,
  formatOrderDate,
  getItemBasePrice,
  getItemDiscountAmount,
  getLotLabel,
} from './helpers';

type Props = {
  order: OrderResponse | null;
  lotMap: Map<string, LotInternalResponse>;
  updatingOrderId: string | null;
  editingPriceItemId: string | null;
  priceDrafts: Record<string, string>;
  isMessagesLoading: boolean;
  isMessagesError: boolean;
  orderedMessages: OrderMessageResponse[];
  onClose: () => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onOpenMessageModal: (order: OrderResponse) => void;
  onPriceDraftChange: (itemId: string, value: string) => void;
  onItemPriceSave: (order: OrderResponse, itemId: string) => void;
};

export default function OrderDetailsModal({
  order,
  lotMap,
  updatingOrderId,
  editingPriceItemId,
  priceDrafts,
  isMessagesLoading,
  isMessagesError,
  orderedMessages,
  onClose,
  onStatusChange,
  onOpenMessageModal,
  onPriceDraftChange,
  onItemPriceSave,
}: Props) {
  if (!order) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-800 bg-gray-900 p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">Картка замовлення</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-gray-200"
          >
            Закрити
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 text-sm text-gray-300 sm:grid-cols-2">
          <p>
            Клієнт: <span className="font-semibold text-white">{order.customer_name}</span>
          </p>
          <p>
            Телефон: <span className="font-semibold text-white">{order.customer_phone || 'Не вказано'}</span>
          </p>
          <p>
            Статус: <span className="font-semibold text-white">{orderStatusLabels[order.status]}</span>
          </p>
          <p>
            Канал: <span className="font-semibold text-white">{orderChannelLabels[order.channel]}</span>
          </p>
          <p>
            Дата: <span className="font-semibold text-white">{formatOrderDate(order.created_at)}</span>
          </p>
          <p className="sm:col-span-2">
            ID: <span className="font-semibold text-white break-all">{order.id}</span>
          </p>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex flex-wrap gap-2">
            {orderStatusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={order.status === option.value || updatingOrderId === order.id}
                onClick={() => void onStatusChange(order.id, option.value)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                  order.status === option.value
                    ? 'border-[#10AD0B]/35 bg-[#10AD0B]/12 text-[#8ff38b]'
                    : 'border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700'
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">Позиції</p>
            {order.channel === 'OFFLINE' ? (
              <p className="text-xs text-amber-300">Для офлайн-замовлень можна змінювати фактичну ціну продажу.</p>
            ) : null}
          </div>
          <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
            {order.items.map((item) => {
              const lot = lotMap.get(item.lot_id);
              const lotPhoto = lot?.photos?.[0];
              const isOfflineOrder = order.channel === 'OFFLINE';
              const isPriceUpdating = editingPriceItemId === item.id;
              const currentDraftPrice = priceDrafts[item.id] ?? String(item.price);
              const basePrice = getItemBasePrice(lot);
              const hasDiscount = basePrice !== null && item.price < basePrice;
              const discountAmount = getItemDiscountAmount(item, lot);

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-3 ${
                    hasDiscount ? 'border-amber-700/50 bg-amber-950/10' : 'border-gray-800 bg-gray-950'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
                      {lotPhoto ? (
                        <img src={lotPhoto} alt={getLotLabel(lot)} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-500">Немає фото</div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 text-sm text-gray-300">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">{getLotLabel(lot)}</p>
                        {hasDiscount ? (
                          <span className="rounded-full border border-amber-700/60 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                            Знижка
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-500 break-all">Lot ID: {item.lot_id}</p>
                      <div className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-3">
                        <p>К-сть: <span className="font-semibold text-white">{item.quantity}</span></p>
                        <p>Ціна: <span className="font-semibold text-white">{formatMoney(item.price)}</span></p>
                        <p>Разом: <span className="font-semibold text-white">{formatMoney(item.total)}</span></p>
                      </div>

                      {hasDiscount ? (
                        <div className="mt-2 rounded-lg border border-amber-700/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <p>
                              Стара ціна:{' '}
                              <span className="font-semibold line-through decoration-amber-300/70">{formatMoney(basePrice)}</span>
                            </p>
                            <p>
                              Нова ціна: <span className="font-semibold text-white">{formatMoney(item.price)}</span>
                            </p>
                            <p>
                              Знижка по позиції: <span className="font-semibold text-amber-200">{formatMoney(discountAmount)}</span>
                            </p>
                          </div>
                        </div>
                      ) : null}

                      {isOfflineOrder ? (
                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,220px)_auto]">
                          <label className="space-y-1">
                            <span className="text-xs text-gray-400">Фактична ціна за 1 шт.</span>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={currentDraftPrice}
                              onChange={(event) => onPriceDraftChange(item.id, event.target.value)}
                              disabled={isPriceUpdating}
                              className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                            />
                          </label>

                          <div className="flex items-end">
                            <button
                              type="button"
                              disabled={isPriceUpdating || Number(currentDraftPrice) === item.price}
                              onClick={() => void onItemPriceSave(order, item.id)}
                              className="w-full rounded-lg border border-amber-700/70 bg-amber-900/30 px-3 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-900/45 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isPriceUpdating ? 'Збереження...' : 'Зберегти ціну'}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-white">Переписка по замовленню</p>
            {order.customer_telegram_id ? (
              <button
                type="button"
                onClick={() => onOpenMessageModal(order)}
                className="rounded-lg border border-blue-700/70 bg-blue-900/30 px-3 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-900/45"
              >
                Надіслати через бота
              </button>
            ) : null}
          </div>

          {isMessagesLoading ? (
            <div className="rounded-xl border border-gray-800 bg-gray-950 p-3 text-sm text-gray-400">Завантаження переписки...</div>
          ) : null}

          {isMessagesError ? (
            <div className="rounded-xl border border-red-800/60 bg-red-950/30 p-3 text-sm text-red-300">
              Не вдалося завантажити переписку.
            </div>
          ) : null}

          {!isMessagesLoading && !isMessagesError && orderedMessages.length === 0 ? (
            <div className="rounded-xl border border-gray-800 bg-gray-950 p-3 text-sm text-gray-400">
              Повідомлень по цьому замовленню ще немає.
            </div>
          ) : null}

          {!isMessagesLoading && !isMessagesError && orderedMessages.length > 0 ? (
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
              {orderedMessages.map((message) => (
                <div
                  key={message.id}
                  className={`rounded-xl border p-3 ${
                    message.direction === 'OUTBOUND'
                      ? 'border-blue-800/60 bg-blue-950/20'
                      : 'border-emerald-800/60 bg-emerald-950/20'
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <span
                      className={`text-xs font-semibold uppercase tracking-wide ${
                        message.direction === 'OUTBOUND' ? 'text-blue-300' : 'text-emerald-300'
                      }`}
                    >
                      {message.direction === 'OUTBOUND' ? 'Ви -> Клієнт' : 'Клієнт -> Ви'}
                    </span>
                    <span className="text-[11px] text-gray-500">{formatMessageDate(message.created_at)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-gray-200">{message.message_text}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-200 transition hover:bg-gray-700"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}
