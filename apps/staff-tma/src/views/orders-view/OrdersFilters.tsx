import type { OrderChannel, OrderStatus } from '../../types/order';
import { orderStatusOptions } from './constants';

type Props = {
  customerInput: string;
  onCustomerInputChange: (value: string) => void;
  statusFilter: '' | OrderStatus;
  onStatusFilterChange: (value: '' | OrderStatus) => void;
  channelFilter: '' | OrderChannel;
  onChannelFilterChange: (value: '' | OrderChannel) => void;
  statusCounts: Record<OrderStatus, number>;
};

export default function OrdersFilters({
  customerInput,
  onCustomerInputChange,
  statusFilter,
  onStatusFilterChange,
  channelFilter,
  onChannelFilterChange,
  statusCounts,
}: Props) {
  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {orderStatusOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onStatusFilterChange(statusFilter === option.value ? '' : option.value)}
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
            onChange={(event) => onCustomerInputChange(event.target.value)}
            placeholder="Ім'я або телефон"
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm text-gray-300">Фільтр за статусом</span>
          <select
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value as '' | OrderStatus)}
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
            onChange={(event) => onChannelFilterChange(event.target.value as '' | OrderChannel)}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500"
          >
            <option value="">Усі канали</option>
            <option value="ONLINE">Онлайн</option>
            <option value="OFFLINE">Офлайн</option>
          </select>
        </label>
      </div>
    </>
  );
}
