import { useEffect, useMemo, useState } from 'react';
import { useStaffLots } from '../api/staffLots';
import { useOrderMessages, useSendOrderBotMessage, useStaffOrders, useUpdateStaffOrderStatus } from '../api/staffOrders';
import type { LotInternalResponse } from '../types/lot';
import type { OrderChannel, OrderMessageResponse, OrderResponse, OrderStatus } from '../types/order';

const orderStatusOptions: Array<{ value: OrderStatus; label: string }> = [
  { value: 'NEW', label: 'Нове' },
  { value: 'PREPAYMENT', label: 'Передплата' },
  { value: 'DONE', label: 'Завершене' },
  { value: 'CANCELLED', label: 'Скасоване' },
];

const orderStatusLabels: Record<OrderStatus, string> = {
  NEW: 'Нове',
  PREPAYMENT: 'Передплата',
  DONE: 'Завершене',
  CANCELLED: 'Скасоване',
};

const orderChannelLabels: Record<OrderChannel, string> = {
  ONLINE: 'Онлайн',
  OFFLINE: 'Офлайн',
};

const formatMoney = (value: number): string => {
  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatOrderDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat('uk-UA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const formatMessageDate = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat('uk-UA', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
};

const getStatusBadgeClass = (status: OrderStatus): string => {
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

const orderSummary = (order: OrderResponse): string => {
  const itemsCount = order.items.reduce((acc, item) => acc + item.quantity, 0);
  return `${itemsCount} шт., ${order.items.length} позицій`;
};

const createOrderItemsSummary = (order: OrderResponse, lotMap: Map<string, LotInternalResponse>): string => {
  const summary = order.items
    .map((item) => {
      const lot = lotMap.get(item.lot_id);
      const lotLabel = getLotLabel(lot);
      return `${lotLabel} x${item.quantity}`;
    })
    .join(', ');

  return summary || `${order.items.length} позицій`;
};

const createBuyerMessage = (order: OrderResponse, lotMap: Map<string, LotInternalResponse>): string => {
  const itemsSummary = createOrderItemsSummary(order, lotMap);
  const statusLabel = orderStatusLabels[order.status];

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

const getOrderPhotoUrls = (order: OrderResponse, lotMap: Map<string, LotInternalResponse>): string[] => {
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

const getLotLabel = (lot?: LotInternalResponse): string => {
  if (!lot) {
    return 'Лот';
  }
  const model = lot.model?.trim();
  return model ? `${lot.brand} ${model}` : lot.brand;
};

export default function OrdersView() {
  const [customerInput, setCustomerInput] = useState('');
  const [debouncedCustomer, setDebouncedCustomer] = useState('');
  const [statusFilter, setStatusFilter] = useState<'' | OrderStatus>('');
  const [channelFilter, setChannelFilter] = useState<'' | OrderChannel>('');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [messageOrder, setMessageOrder] = useState<OrderResponse | null>(null);
  const [messageText, setMessageText] = useState('');

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedCustomer(customerInput.trim());
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [customerInput]);

  const { data: orders = [], isLoading, isError, isFetching } = useStaffOrders({
    page: 1,
    pageSize: 50,
    status: statusFilter,
    channel: channelFilter,
    customer: debouncedCustomer,
  });

  const { data: lots = [] } = useStaffLots({ page: 1, pageSize: 1000 });
  const {
    data: orderMessages = [],
    isLoading: isMessagesLoading,
    isError: isMessagesError,
  } = useOrderMessages(selectedOrder?.id ?? null);

  const updateStatusMutation = useUpdateStaffOrderStatus();
  const sendOrderBotMessageMutation = useSendOrderBotMessage();

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const aTime = new Date(a.created_at).getTime();
      const bTime = new Date(b.created_at).getTime();
      return bTime - aTime;
    });
  }, [orders]);

  const lotMap = useMemo(() => {
    return new Map(lots.map((lot) => [lot.id, lot]));
  }, [lots]);

  const statusCounts = useMemo(() => {
    return sortedOrders.reduce<Record<OrderStatus, number>>(
      (acc, order) => {
        acc[order.status] += 1;
        return acc;
      },
      { NEW: 0, PREPAYMENT: 0, DONE: 0, CANCELLED: 0 },
    );
  }, [sortedOrders]);

  const orderedMessages = useMemo(() => {
    return [...orderMessages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }, [orderMessages]);

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    try {
      setUpdatingOrderId(orderId);
      await updateStatusMutation.mutateAsync({
        id: orderId,
        payload: { status },
      });
    } catch {
      alert('Не вдалося змінити статус замовлення.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const openMessageModal = (order: OrderResponse) => {
    setMessageOrder(order);
    setMessageText(createBuyerMessage(order, lotMap));
  };

  const handleSendBotMessage = async () => {
    if (!messageOrder) {
      return;
    }

    const trimmedMessage = messageText.trim();
    if (!trimmedMessage) {
      alert('Вкажіть текст повідомлення.');
      return;
    }

    try {
      await sendOrderBotMessageMutation.mutateAsync({
        id: messageOrder.id,
        payload: { message: trimmedMessage },
      });
      alert('Повідомлення успішно відправлено через бота.');
      setMessageOrder(null);
      setMessageText('');
    } catch {
      alert('Не вдалося відправити повідомлення через бота.');
    }
  };

  return (
    <section className="space-y-4 p-4 text-white">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Замовлення</h2>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {orderStatusOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setStatusFilter((prev) => (prev === option.value ? '' : option.value))}
            className={`rounded-2xl border px-3 py-3 text-left transition ${
              statusFilter === option.value
                ? 'border-[#10AD0B]/35 bg-[#10AD0B]/12'
                : 'border-gray-800 bg-gray-900 hover:bg-gray-800'
            }`}
          >
            <p className="text-xs uppercase tracking-wide text-gray-500">{option.label}</p>
            <p className="mt-2 text-xl font-bold text-white">{statusCounts[option.value]}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label className="space-y-1">
          <span className="text-sm text-gray-300">Пошук клієнта</span>
          <input
            type="text"
            value={customerInput}
            onChange={(event) => setCustomerInput(event.target.value)}
            placeholder="Ім'я або телефон"
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm text-gray-300">Фільтр за статусом</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as '' | OrderStatus)}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500"
          >
            <option value="">Усі статуси</option>
            {orderStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm text-gray-300">Канал продажу</span>
          <select
            value={channelFilter}
            onChange={(event) => setChannelFilter(event.target.value as '' | OrderChannel)}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500"
          >
            <option value="">Усі канали</option>
            <option value="ONLINE">Онлайн</option>
            <option value="OFFLINE">Офлайн</option>
          </select>
        </label>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-400">Завантаження замовлень...</div>
      ) : null}

      {isError ? (
        <div className="rounded-xl border border-red-800/60 bg-red-950/30 p-4 text-sm text-red-300">
          Не вдалося завантажити список замовлень.
        </div>
      ) : null}

      {!isLoading && !isError && sortedOrders.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-400">Замовлення не знайдені.</div>
      ) : null}

      <div className="space-y-3">
        {sortedOrders.map((order) => {
          const previewPhotos = getOrderPhotoUrls(order, lotMap);

          return (
            <article
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className="cursor-pointer rounded-2xl border border-gray-800 bg-gray-900 p-4 transition hover:border-gray-700"
            >
              <div className="flex items-start gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-800 bg-gray-950">
                  {previewPhotos[0] ? (
                    <img src={previewPhotos[0]} alt="Фото замовлення" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-500">Немає фото</div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-base font-semibold text-white">{order.customer_name}</h3>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        <p className="text-xs text-gray-400">{order.customer_phone || 'Телефон не вказано'}</p>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                          order.channel === 'OFFLINE'
                            ? 'border-amber-700/40 bg-amber-900/20 text-amber-200'
                            : 'border-blue-700/40 bg-blue-900/20 text-blue-200'
                        }`}>
                          {orderChannelLabels[order.channel]}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500">{formatOrderDate(order.created_at)}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
                      {orderStatusLabels[order.status]}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-1 gap-1 text-sm text-gray-300 sm:grid-cols-3">
                    <p>
                      Сума: <span className="font-semibold text-white">{formatMoney(order.total_amount)}</span>
                    </p>
                    <p>
                      Позиції: <span className="font-semibold text-white">{orderSummary(order)}</span>
                    </p>
                    <p className="truncate text-xs text-gray-500">ID: {order.id}</p>
                  </div>

                  {previewPhotos.length > 1 ? (
                    <div className="mt-2 flex gap-1.5">
                      {previewPhotos.slice(1).map((photoUrl) => (
                        <img
                          key={photoUrl}
                          src={photoUrl}
                          alt="Фото товару"
                          className="h-8 w-8 rounded-md border border-gray-800 object-cover"
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>

              <div
                className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex flex-wrap gap-2">
                  {orderStatusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      disabled={order.status === option.value || updatingOrderId === order.id}
                      onClick={() => void handleStatusChange(order.id, option.value)}
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                        order.status === option.value
                          ? 'border-[#10AD0B]/35 bg-[#10AD0B]/12 text-[#8ff38b]'
                          : 'border-gray-700 bg-gray-950 text-gray-200 hover:bg-gray-800'
                      } disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <label className="space-y-1">
                  <span className="text-xs text-gray-400">Змінити статус</span>
                  <select
                    value={order.status}
                    disabled={updatingOrderId === order.id}
                    onChange={(event) => handleStatusChange(order.id, event.target.value as OrderStatus)}
                    className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {orderStatusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                {order.customer_telegram_id ? (
                  <button
                    type="button"
                    onClick={() => openMessageModal(order)}
                    className="mt-auto rounded-lg border border-blue-700/70 bg-blue-900/30 px-3 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-900/45"
                  >
                    Надіслати через бота
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {isFetching && !isLoading ? <p className="text-xs text-gray-500">Оновлення списку...</p> : null}

      {selectedOrder ? (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="w-full max-w-2xl rounded-2xl border border-gray-800 bg-gray-900 p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">Картка замовлення</h3>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="rounded-md px-2 py-1 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-gray-200"
              >
                Закрити
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 text-sm text-gray-300 sm:grid-cols-2">
              <p>
                Клієнт: <span className="font-semibold text-white">{selectedOrder.customer_name}</span>
              </p>
              <p>
                Телефон: <span className="font-semibold text-white">{selectedOrder.customer_phone || 'Не вказано'}</span>
              </p>
              <p>
                Статус: <span className="font-semibold text-white">{orderStatusLabels[selectedOrder.status]}</span>
              </p>
              <p>
                Канал: <span className="font-semibold text-white">{orderChannelLabels[selectedOrder.channel]}</span>
              </p>
              <p>
                Дата: <span className="font-semibold text-white">{formatOrderDate(selectedOrder.created_at)}</span>
              </p>
              <p className="sm:col-span-2">
                ID: <span className="font-semibold text-white break-all">{selectedOrder.id}</span>
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex flex-wrap gap-2">
                {orderStatusOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    disabled={selectedOrder.status === option.value || updatingOrderId === selectedOrder.id}
                    onClick={() => void handleStatusChange(selectedOrder.id, option.value)}
                    className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                      selectedOrder.status === option.value
                        ? 'border-[#10AD0B]/35 bg-[#10AD0B]/12 text-[#8ff38b]'
                        : 'border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700'
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <p className="text-sm font-semibold text-white">Позиції</p>
              <div className="max-h-[45vh] space-y-2 overflow-y-auto pr-1">
                {selectedOrder.items.map((item) => {
                  const lot = lotMap.get(item.lot_id);
                  const lotPhoto = lot?.photos?.[0];

                  return (
                    <div key={`${selectedOrder.id}-${item.lot_id}`} className="rounded-xl border border-gray-800 bg-gray-950 p-3">
                      <div className="flex items-start gap-3">
                        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
                          {lotPhoto ? (
                            <img src={lotPhoto} alt={getLotLabel(lot)} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-500">Немає фото</div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 text-sm text-gray-300">
                          <p className="font-semibold text-white">{getLotLabel(lot)}</p>
                          <p className="text-xs text-gray-500 break-all">Lot ID: {item.lot_id}</p>
                          <div className="mt-1 grid grid-cols-1 gap-1 sm:grid-cols-3">
                            <p>К-сть: <span className="font-semibold text-white">{item.quantity}</span></p>
                            <p>Ціна: <span className="font-semibold text-white">{formatMoney(item.price)}</span></p>
                            <p>Разом: <span className="font-semibold text-white">{formatMoney(item.total)}</span></p>
                          </div>
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
                {selectedOrder.customer_telegram_id ? (
                  <button
                    type="button"
                    onClick={() => openMessageModal(selectedOrder)}
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
                  {orderedMessages.map((message: OrderMessageResponse) => (
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
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-200 transition hover:bg-gray-700"
              >
                Закрити
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {messageOrder ? (
        <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="w-full max-w-xl rounded-2xl border border-gray-800 bg-gray-900 p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-white">Повідомлення покупцю</h3>
                <p className="text-xs text-gray-400">
                  {messageOrder.customer_name}
                  {messageOrder.customer_telegram_id ? ` • chat_id ${messageOrder.customer_telegram_id}` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (sendOrderBotMessageMutation.isPending) {
                    return;
                  }
                  setMessageOrder(null);
                  setMessageText('');
                }}
                className="rounded-md px-2 py-1 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-gray-200"
              >
                Закрити
              </button>
            </div>

            <textarea
              value={messageText}
              onChange={(event) => setMessageText(event.target.value)}
              rows={8}
              className="w-full rounded-xl border border-gray-700 bg-gray-950 px-3 py-3 text-sm text-white outline-none focus:border-blue-500"
            />

            <p className="mt-2 text-xs text-gray-500">
              Шаблон заповнюється автоматично за поточним статусом замовлення, але його можна відредагувати перед відправкою.
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  if (sendOrderBotMessageMutation.isPending) {
                    return;
                  }
                  setMessageOrder(null);
                  setMessageText('');
                }}
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-200 transition hover:bg-gray-700"
              >
                Скасувати
              </button>
              <button
                type="button"
                onClick={() => void handleSendBotMessage()}
                disabled={sendOrderBotMessageMutation.isPending}
                className="rounded-lg border border-blue-700/70 bg-blue-900/30 px-3 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-900/45 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sendOrderBotMessageMutation.isPending ? 'Відправка...' : 'Надіслати через бота'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
