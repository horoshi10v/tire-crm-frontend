import type { LotInternalResponse } from '../../types/lot';
import type { OrderResponse, OrderStatus } from '../../types/order';
import { orderChannelLabels, orderStatusLabels, orderStatusOptions } from './constants';
import { formatMoney, formatOrderDate, getOrderPhotoUrls, getStatusBadgeClass, orderSummary } from './helpers';

type Props = {
  orders: OrderResponse[];
  lotMap: Map<string, LotInternalResponse>;
  updatingOrderId: string | null;
  onSelectOrder: (order: OrderResponse) => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
  onOpenMessageModal: (order: OrderResponse) => void;
};

export default function OrdersList({ orders, lotMap, updatingOrderId, onSelectOrder, onStatusChange, onOpenMessageModal }: Props) {
  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const previewPhotos = getOrderPhotoUrls(order, lotMap);

        return (
          <article
            key={order.id}
            onClick={() => onSelectOrder(order)}
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

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]" onClick={(event) => event.stopPropagation()}>
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
                  onChange={(event) => onStatusChange(order.id, event.target.value as OrderStatus)}
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
                  onClick={() => onOpenMessageModal(order)}
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
  );
}
