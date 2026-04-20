import { formatMediumDateTime, formatMoney, getOrderStatusLabel } from '@tire-crm/shared';
import type { LotPublicResponse } from '../types/lot';
import type { OrderResponse } from '../api/useOrders';

type OrderDetailsModalProps = {
    order: OrderResponse | null;
    lotLookup: Record<string, LotPublicResponse>;
    onClose: () => void;
};

const formatOrderMoney = (value: number) => `${formatMoney(value)} грн`;

const getStatusClassName = (status: string) => {
    switch (status) {
        case 'DONE':
            return 'bg-[#10AD0B]/15 text-[#62f05d] border border-[#10AD0B]/20';
        case 'CANCELLED':
            return 'bg-red-500/10 text-red-300 border border-red-500/20';
        case 'PREPAYMENT':
            return 'bg-amber-500/10 text-amber-200 border border-amber-500/20';
        default:
            return 'bg-white/5 text-gray-200 border border-white/10';
    }
};

export const OrderDetailsModal = ({ order, lotLookup, onClose }: OrderDetailsModalProps) => {
    if (!order) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[80] flex items-end bg-black/75 p-4 backdrop-blur-sm sm:items-center sm:justify-center">
            <button type="button" className="absolute inset-0" aria-label="Закрити деталі замовлення" onClick={onClose} />

            <div className="relative w-full max-w-lg rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(8,8,8,0.98),rgba(14,14,14,0.98))] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.48)]">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#10AD0B]">Деталі замовлення</p>
                        <h2 className="mt-2 text-xl font-bold text-white">Замовлення #{order.id.slice(0, 8)}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl text-white transition hover:bg-white/10"
                        aria-label="Закрити"
                    >
                        &times;
                    </button>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3">
                    <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Статус</p>
                        <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClassName(order.status)}`}>
                            {getOrderStatusLabel(order.status)}
                        </span>
                    </div>
                    <div className="text-right">
                        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Сума</p>
                        <p className="mt-2 text-lg font-bold text-white">{formatOrderMoney(order.total_amount)}</p>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Дата</p>
                        <p className="mt-2 font-medium text-white">
                            {formatMediumDateTime(order.created_at)}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Телефон</p>
                        <p className="mt-2 font-medium text-white">{order.customer_phone || 'Не вказано'}</p>
                    </div>
                </div>

                <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">Склад замовлення</p>
                    <div className="mt-3 space-y-3">
                        {order.items.map((item) => {
                            const lot = lotLookup[item.lot_id];
                            const snapshotTitle = `${item.brand ?? ''} ${item.model ?? ''}`.trim();
                            const lotTitle = snapshotTitle || (lot ? `${lot.brand} ${lot.model}`.trim() : `Товар ${item.lot_id.slice(0, 8)}`);
                            const lotPhoto = item.photo || lot?.photos?.[0];

                            return (
                                <div key={`${order.id}-${item.lot_id}`} className="flex gap-3 rounded-2xl border border-white/10 bg-black/25 p-3">
                                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-900">
                                        {lotPhoto ? (
                                            <img src={lotPhoto} alt={lotTitle} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-center text-[11px] leading-tight text-gray-500">Немає фото</span>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-white">{lotTitle}</p>
                                        <p className="mt-1 text-sm text-gray-400">
                                            {formatOrderMoney(item.price)} x {item.quantity} шт.
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-[#10AD0B]">{formatOrderMoney(item.total)}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
