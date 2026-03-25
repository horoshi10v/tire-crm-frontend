// apps/client-tma/src/components/Profile.tsx
import { useMemo, useState } from 'react';
import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useAuthStore } from '@tire-crm/shared';
import { OrderDetailsModal } from './OrderDetailsModal';
import { useOrders, type OrderResponse } from '../api/useOrders';
import type { PaginatedLotsResponse } from '../api/useLots';
import type { LotPublicResponse } from '../types/lot';

interface ProfileProps {
    onClose: () => void;
    initialSelectedOrderId?: string | null;
}

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'NEW':
            return 'Нове';
        case 'PREPAYMENT':
            return 'Передплата';
        case 'DONE':
            return 'Завершене';
        case 'CANCELLED':
            return 'Скасоване';
        default:
            return status;
    }
};

export const Profile = ({ onClose, initialSelectedOrderId = null }: ProfileProps) => {
    const user = useAuthStore((state) => state.user);
    const { data: orders, isLoading } = useOrders();
    const queryClient = useQueryClient();
    const [isClosing, setIsClosing] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialSelectedOrderId);
    const formatMoney = (value: number) =>
        `${new Intl.NumberFormat('uk-UA', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(value)} грн`;

    const selectedOrder = useMemo<OrderResponse | null>(
        () => orders?.find((order) => order.id === selectedOrderId) ?? null,
        [orders, selectedOrderId]
    );

    const lotLookup = useMemo(() => {
        const cachedLots = queryClient.getQueriesData<InfiniteData<PaginatedLotsResponse>>({ queryKey: ['lots'] });
        const nextLookup: Record<string, LotPublicResponse> = {};

        cachedLots.forEach(([, lotsData]) => {
            lotsData?.pages?.forEach((page) => {
                page.items?.forEach((lot) => {
                    nextLookup[lot.id] = lot;
                });
            });
        });

        return nextLookup;
    }, [queryClient]);

    const handleClose = () => {
        setIsClosing(true);
        window.setTimeout(onClose, 320);
    };

    return (
        <div
            className="fixed inset-0 z-40 bg-gray-950 transition-[background-color,opacity] duration-300 ease-out"
            style={{
                opacity: isClosing ? 0 : 1,
                backgroundColor: isClosing ? 'rgba(3, 3, 3, 0)' : 'rgba(3, 3, 3, 0.98)',
            }}
        >
            <div
                className="flex h-full flex-col p-4 transition-transform duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                    transform: isClosing ? 'translateY(40px)' : 'translateY(0)',
                    opacity: isClosing ? 0.92 : 1,
                }}
            >
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Мій профіль</h2>
                <button onClick={handleClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>

            <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 mb-6">
                <p className="text-sm text-gray-400 mb-1">Користувач Telegram</p>
                <p className="text-lg text-white font-medium">
                    {user?.firstName} {user?.lastName}
                </p>
                {user?.username && <p className="text-sm text-[#10AD0B]">@{user.username}</p>}
                <p className="text-xs text-gray-500 mt-2">Роль: {user?.role}</p>
            </div>

            <h3 className="text-xl font-bold text-white mb-4">Мої замовлення</h3>

            {isLoading ? (
                <div className="text-gray-400 text-center py-4">Завантаження замовлень...</div>
            ) : !orders || orders.length === 0 ? (
                <div className="text-gray-500 text-center py-4 bg-gray-900 rounded-xl border border-gray-800">
                    У вас ще немає замовлень.
                </div>
            ) : (
                <div className="flex-grow overflow-y-auto flex flex-col gap-3">
                    {orders.map((order) => (
                        <button
                            type="button"
                            key={order.id}
                            onClick={() => setSelectedOrderId(order.id)}
                            className="bg-gray-900 p-4 rounded-xl border border-gray-800 text-left transition hover:border-[#10AD0B]/20 hover:bg-gray-900/80"
                        >
                            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                                <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</span>
                                <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                                    order.status === 'DONE' ? 'bg-green-900 text-green-300' :
                                        order.status === 'CANCELLED' ? 'bg-red-900 text-red-300' :
                                            'bg-[#10AD0B]/15 text-[#56e052]'
                                }`}>
                  {getStatusLabel(order.status)}
                </span>
                            </div>
                            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 pt-3">
                                <div className="min-w-0">
                                    <span className="block text-sm text-gray-300">{order.items.length} позицій</span>
                                    <span className="mt-1 block text-xs text-gray-500">Телефон: {order.customer_phone}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-[11px] uppercase tracking-[0.18em] text-gray-500">Сума</span>
                                    <span className="mt-1 block text-lg font-bold text-white">{formatMoney(order.total_amount)}</span>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
            </div>

            <OrderDetailsModal order={selectedOrder} lotLookup={lotLookup} onClose={() => setSelectedOrderId(null)} />
        </div>
    );
};
