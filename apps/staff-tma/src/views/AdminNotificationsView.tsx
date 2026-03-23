import { useState } from 'react';
import { useAdminNotifications, useMarkAdminNotificationRead } from '../api/adminNotifications';
import type { AdminNotification, AdminNotificationType } from '../types/adminNotification';

const PAGE_SIZE = 20;

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('uk-UA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const typeLabels: Record<AdminNotificationType, string> = {
  ORDER_CREATED: 'Нове замовлення',
  CUSTOMER_MESSAGE: 'Повідомлення клієнта',
};

const getTypeBadgeClassName = (type: AdminNotificationType) => {
  if (type === 'ORDER_CREATED') {
    return 'border-blue-700/40 bg-blue-900/20 text-blue-200';
  }

  return 'border-[#10AD0B]/30 bg-[#10AD0B]/10 text-[#8ff38b]';
};

const getOrderLabel = (notification: AdminNotification) => {
  if (!notification.order_id) {
    return '';
  }

  return notification.order_id.slice(0, 8);
};

export default function AdminNotificationsView() {
  const [page, setPage] = useState(1);
  const [type, setType] = useState<'' | AdminNotificationType>('');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const { data, isLoading, isError, isFetching } = useAdminNotifications({
    page,
    page_size: PAGE_SIZE,
    type,
    is_read: unreadOnly ? false : undefined,
  });
  const markReadMutation = useMarkAdminNotificationRead();

  const notifications = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <section className="space-y-4 p-4 text-white">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-white">Центр сповіщень</h2>
        <p className="text-sm text-gray-400">Нові замовлення та повідомлення клієнтів, які дублюються адміністраторам у Telegram.</p>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,240px)_auto]">
        <label className="space-y-1">
          <span className="text-sm text-gray-300">Тип події</span>
          <select
            value={type}
            onChange={(event) => {
              setType(event.target.value as '' | AdminNotificationType);
              setPage(1);
            }}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-[#10AD0B]"
          >
            <option value="">Усі події</option>
            <option value="ORDER_CREATED">Нове замовлення</option>
            <option value="CUSTOMER_MESSAGE">Повідомлення клієнта</option>
          </select>
        </label>

        <label className="flex items-end gap-3 rounded-xl border border-gray-800 bg-gray-900 px-4 py-3">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(event) => {
              setUnreadOnly(event.target.checked);
              setPage(1);
            }}
            className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-[#10AD0B] focus:ring-[#10AD0B]"
          />
          <span className="text-sm text-gray-200">Лише непрочитані</span>
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-800 bg-gray-900 px-4 py-3">
        <p className="text-sm text-gray-300">
          Показано <span className="font-semibold text-white">{notifications.length}</span> з{' '}
          <span className="font-semibold text-white">{total}</span> сповіщень
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Назад
          </button>
          <span className="min-w-24 text-center text-sm text-gray-300">
            Сторінка {page} з {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Далі
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-400">Завантаження сповіщень...</div>
      ) : null}

      {isError ? (
        <div className="rounded-xl border border-red-800/60 bg-red-950/30 p-4 text-sm text-red-300">
          Не вдалося завантажити центр сповіщень.
        </div>
      ) : null}

      {!isLoading && !isError && notifications.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-400">Сповіщень не знайдено.</div>
      ) : null}

      <div className="space-y-3">
        {notifications.map((notification) => (
          <article
            key={notification.id}
            className={`rounded-2xl border p-4 transition ${
              notification.is_read
                ? 'border-gray-800 bg-gray-900'
                : 'border-[#10AD0B]/30 bg-[#10AD0B]/[0.07]'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getTypeBadgeClassName(notification.type)}`}>
                    {typeLabels[notification.type]}
                  </span>
                  {!notification.is_read ? (
                    <span className="rounded-full border border-amber-700/40 bg-amber-900/20 px-2.5 py-1 text-xs font-semibold text-amber-200">
                      Нове
                    </span>
                  ) : null}
                </div>
                <h3 className="text-base font-semibold text-white">{notification.title}</h3>
              </div>

              <div className="text-right text-xs text-gray-500">
                {notification.order_id ? <p>Замовлення #{getOrderLabel(notification)}</p> : null}
                <p>{formatDate(notification.created_at)}</p>
              </div>
            </div>

            <p className="mt-3 whitespace-pre-wrap text-sm text-gray-200">{notification.body}</p>

            {(notification.customer_name || notification.customer_phone || notification.customer_username) ? (
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-300">
                {notification.customer_name ? (
                  <span className="rounded-full border border-gray-700 bg-gray-950 px-2.5 py-1">{notification.customer_name}</span>
                ) : null}
                {notification.customer_phone ? (
                  <span className="rounded-full border border-gray-700 bg-gray-950 px-2.5 py-1">{notification.customer_phone}</span>
                ) : null}
                {notification.customer_username ? (
                  <span className="rounded-full border border-gray-700 bg-gray-950 px-2.5 py-1">
                    @{notification.customer_username.replace(/^@/, '')}
                  </span>
                ) : null}
              </div>
            ) : null}

            {!notification.is_read ? (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => markReadMutation.mutate(notification.id)}
                  disabled={markReadMutation.isPending}
                  className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-medium text-white transition hover:bg-gray-700 disabled:opacity-50"
                >
                  Позначити прочитаним
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </div>

      {isFetching && !isLoading ? <p className="text-xs text-gray-500">Оновлення сповіщень...</p> : null}
    </section>
  );
}
