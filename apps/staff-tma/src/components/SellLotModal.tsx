import { useEffect, useMemo, useState } from 'react';
import { formatMoney } from '@tire-crm/shared';
import { useCreateStaffOrder, useUpdateStaffOrderStatus } from '../api/staffOrders';
import type { LotInternalResponse } from '../types/lot';
import type { CreateOrderDTO, OrderStatus } from '../types/order';

type SellLotModalProps = {
  lot: LotInternalResponse | null;
  onClose: () => void;
  onSuccess?: () => void;
};

const orderStatusOptions: Array<{ value: OrderStatus; label: string }> = [
  { value: 'DONE', label: 'Продано та оплачено' },
  { value: 'PREPAYMENT', label: 'Передплата' },
  { value: 'NEW', label: 'Нове замовлення' },
];

const defaultCustomerName = 'Офлайн покупець';

export default function SellLotModal({ lot, onClose, onSuccess }: SellLotModalProps) {
  const createOrderMutation = useCreateStaffOrder();
  const updateOrderStatusMutation = useUpdateStaffOrderStatus();

  const [customerName, setCustomerName] = useState(defaultCustomerName);
  const [customerPhone, setCustomerPhone] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [finalPriceInput, setFinalPriceInput] = useState('');
  const [status, setStatus] = useState<OrderStatus>('DONE');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!lot) {
      return;
    }

    setCustomerName(defaultCustomerName);
    setCustomerPhone('');
    setQuantity(lot.current_quantity > 0 ? 1 : 0);
    setFinalPriceInput(String(lot.sell_price));
    setStatus('DONE');
    setComment('');
    setError('');
  }, [lot]);

  const lotTitle = useMemo(() => {
    if (!lot) {
      return '';
    }
    return `${lot.brand} ${lot.model ?? ''}`.trim();
  }, [lot]);

  if (!lot) {
    return null;
  }

  const isSubmitting = createOrderMutation.isPending || updateOrderStatusMutation.isPending;
  const parsedFinalPrice = Number(finalPriceInput);
  const hasCustomPrice = finalPriceInput.trim() !== '' && parsedFinalPrice !== lot.sell_price;
  const totalAmount = (Number.isFinite(parsedFinalPrice) ? parsedFinalPrice : 0) * quantity;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (lot.current_quantity <= 0) {
      setError('Цей лот вже недоступний для продажу.');
      return;
    }

    if (quantity < 1 || quantity > lot.current_quantity) {
      setError(`Кількість має бути від 1 до ${lot.current_quantity}.`);
      return;
    }

    if (!Number.isFinite(parsedFinalPrice) || parsedFinalPrice <= 0) {
      setError('Вкажіть коректну фінальну ціну.');
      return;
    }

    const payload: CreateOrderDTO = {
      customer_name: customerName.trim() || defaultCustomerName,
      customer_phone: customerPhone.trim() || undefined,
      channel: 'OFFLINE',
      items: [
        {
          lot_id: lot.id,
          quantity,
          final_price: parsedFinalPrice,
        },
      ],
    };

    try {
      setError('');
      const createdOrder = await createOrderMutation.mutateAsync(payload);

      if (status !== 'NEW') {
        await updateOrderStatusMutation.mutateAsync({
          id: createdOrder.id,
          payload: {
            status,
            comment: comment.trim() || 'Створено зі staff TMA як офлайн-продаж',
          },
        });
      }

      onSuccess?.();
      onClose();
    } catch (submitError) {
      const message =
        (submitError as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error ||
        (submitError as { message?: string })?.message ||
        'Не вдалося оформити продаж.';
      setError(message);
    }
  };

  return (
    <div className="fixed inset-0 z-[82] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="w-full max-w-lg rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Продати товар</h2>
            <p className="text-sm text-gray-400">{lotTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-md px-2 py-1 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-gray-200 disabled:opacity-50"
          >
            Закрити
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-4 text-white">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm text-gray-300">Покупець</span>
              <input
                type="text"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                placeholder={defaultCustomerName}
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm text-gray-300">Телефон</span>
              <input
                type="text"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                placeholder="+380..."
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm text-gray-300">Кількість</span>
              <input
                type="number"
                min={1}
                max={Math.max(lot.current_quantity, 1)}
                value={quantity}
                onChange={(event) => setQuantity(Number(event.target.value))}
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm text-gray-300">Статус</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as OrderStatus)}
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
              >
                {orderStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 sm:col-span-2">
              <span className="text-sm text-gray-300">Фінальна ціна за 1 шт.</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={finalPriceInput}
                onChange={(event) => setFinalPriceInput(event.target.value)}
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                placeholder={String(lot.sell_price)}
              />
            </label>
          </div>

          <label className="block space-y-1">
            <span className="text-sm text-gray-300">Коментар</span>
            <textarea
              rows={3}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
              placeholder="Наприклад: офлайн продаж у сервісі"
            />
          </label>

          <div className="rounded-xl border border-gray-800 bg-gray-950 p-3 text-sm text-gray-300">
            <p>
              Залишок на складі: <span className="font-semibold text-white">{lot.current_quantity}</span>
            </p>
            <p>
              Базова ціна: <span className="font-semibold text-white">{formatMoney(lot.sell_price)} грн</span>
            </p>
            <p>
              Сума продажу: <span className="font-semibold text-white">{formatMoney(totalAmount)} грн</span>
            </p>
            {hasCustomPrice ? <p className="mt-1 text-xs text-amber-300">Застосовується ручна ціна для офлайн-продажу.</p> : null}
            <p className="mt-1 text-xs text-gray-500">
              Якщо телефон не вказано, замовлення буде створено як офлайн-продаж без контакту покупця.
            </p>
          </div>

          {error ? <div className="rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</div> : null}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm font-semibold text-gray-100 transition hover:bg-gray-700 disabled:opacity-50"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={isSubmitting || lot.current_quantity <= 0}
              className="flex-1 rounded-lg border border-emerald-700/70 bg-emerald-900/30 px-4 py-2.5 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-900/45 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Оформлення...' : 'Продати'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
