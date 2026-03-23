// apps/client-tma/src/components/CartModal.tsx
import { useEffect, useState } from 'react';
import { useCartStore } from '../store/useCartStore';
import { useCreateOrder } from '../api/useCreateOrder';
import { useAuthStore } from '@tire-crm/shared';

interface CartModalProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenServiceInfo: () => void;
    onOrderSuccess: (order: OrderResponse) => void;
    onOrderError: (message: string) => void;
    onCartLimitReached: (message: string) => void;
}

type OrderResponse = {
    id: string;
    created_at: string;
    customer_name: string;
    customer_phone: string;
    customer_username?: string;
    customer_telegram_id?: number;
    status: string;
    total_amount: number;
    items: Array<{
        lot_id: string;
        price: number;
        quantity: number;
        total: number;
    }>;
};

export const CartModal = ({ isOpen, onClose, onOpenServiceInfo, onOrderSuccess, onOrderError, onCartLimitReached }: CartModalProps) => {
    const { items, addItem, removeItem, clearCart, getTotalPrice } = useCartStore();
    const { mutate: createOrder, isPending: isSubmitting } = useCreateOrder();
    const [isVisible, setIsVisible] = useState(false);

    const user = useAuthStore((state) => state.user);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerUsername, setCustomerUsername] = useState('');
    const [customerTelegramId, setCustomerTelegramId] = useState<number | undefined>(undefined);
    const formatMoney = (value: number) =>
        `${new Intl.NumberFormat('uk-UA', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(value)} грн`;

    const tgUser = (window as {
        Telegram?: {
            WebApp?: {
                initDataUnsafe?: {
                    user?: {
                        id?: number;
                        first_name?: string;
                        last_name?: string;
                        username?: string;
                        phone_number?: string;
                    };
                };
            };
        };
    }).Telegram?.WebApp?.initDataUnsafe?.user;

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const frameId = window.requestAnimationFrame(() => {
            setIsVisible(true);
        });

        const authFullName = user ? [user.firstName, user.lastName].filter(Boolean).join(' ').trim() : '';
        const tgFullName = [tgUser?.first_name, tgUser?.last_name].filter(Boolean).join(' ').trim();
        const nextName = authFullName || tgFullName || user?.username || tgUser?.username || '';
        const nextUsername = user?.username || tgUser?.username || '';
        const nextTelegramId = user?.telegramId || tgUser?.id;

        setCustomerName((prev) => prev || nextName);
        setCustomerUsername(nextUsername);
        setCustomerTelegramId(nextTelegramId);
        return () => {
            window.cancelAnimationFrame(frameId);
        };
    }, [isOpen, user, tgUser?.first_name, tgUser?.id, tgUser?.last_name, tgUser?.username]);

    const handleClose = (afterClose?: () => void) => {
        setIsVisible(false);
        window.setTimeout(() => {
            onClose();
            afterClose?.();
        }, 320);
    };

    const handleCheckout = (e: React.FormEvent) => {
        e.preventDefault();
        if (items.length === 0) return;

        const orderItems = items.map((item) => ({
            lot_id: item.lot.id,
            quantity: item.quantity,
        }));

        createOrder(
            {
                customer_name: customerName.trim(),
                customer_phone: customerPhone.trim(),
                customer_username: customerUsername || undefined,
                customer_telegram_id: customerTelegramId,
                items: orderItems,
            },
            {
                onSuccess: (data) => {
                    handleClose(() => {
                        clearCart();
                        setCustomerName('');
                        setCustomerPhone('');
                        setCustomerUsername('');
                        setCustomerTelegramId(undefined);
                        onOrderSuccess(data as OrderResponse);
                    });
                },
                onError: (err: { response?: { data?: { error?: string; message?: string } }; message?: string }) => {
                    console.error('Failed to place order:', err);
                    onOrderError(err.response?.data?.error || err.response?.data?.message || err.message || 'Не вдалося оформити замовлення.');
                },
            }
        );
    };

    return (
        <div
            className="fixed inset-0 z-50 transition-[background-color,opacity] duration-300 ease-out"
            style={{
                opacity: isVisible ? 1 : 0,
                backgroundColor: isVisible ? 'rgba(3, 3, 3, 0.95)' : 'rgba(3, 3, 3, 0)',
            }}
        >
            <div
                className="flex h-full flex-col p-4 backdrop-blur-sm transition-transform duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                    transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
                    opacity: isVisible ? 1 : 0.92,
                }}
            >
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Кошик</h2>
                <button onClick={() => handleClose()} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>

            {items.length === 0 ? (
                <div className="flex-grow flex items-center justify-center text-gray-500">Кошик порожній</div>
            ) : (
                <div className="flex-grow overflow-y-auto flex flex-col gap-4">
                    <div className="space-y-3">
                        {items.map((item) => (
                            <div key={item.lot.id} className="flex justify-between items-center bg-gray-900 p-3 rounded-xl border border-gray-800">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-100">{item.lot.brand} {item.lot.model}</h3>
                                    <p className="text-xs text-gray-400">{formatMoney(item.lot.sell_price)} x {item.quantity}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => removeItem(item.lot.id)} className="w-8 h-8 rounded-full bg-gray-800 text-gray-300 flex items-center justify-center hover:bg-gray-700">-</button>
                                    <span className="text-sm font-medium">{item.quantity}</span>
                                    <button
                                        onClick={() => {
                                            const result = addItem(item.lot);
                                            if (!result.added) {
                                                onCartLimitReached(`Для товару "${item.lot.brand} ${item.lot.model}" доступно лише ${item.lot.current_quantity} шт.`);
                                            }
                                        }}
                                        disabled={item.quantity >= item.lot.current_quantity}
                                        className="w-8 h-8 rounded-full bg-gray-800 text-gray-300 flex items-center justify-center hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-between items-center py-4 border-t border-gray-800 mt-4">
                        <span className="text-gray-400">Сума:</span>
                        <span className="text-xl font-bold text-[#10AD0B]">{formatMoney(getTotalPrice())}</span>
                    </div>

                    <form onSubmit={handleCheckout} className="mt-auto flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={onOpenServiceInfo}
                            className="flex w-full items-center justify-between rounded-2xl border border-[#10AD0B]/20 bg-black/50 px-4 py-3 text-left transition hover:border-[#10AD0B]/40 hover:bg-black/65"
                        >
                            <div className="min-w-0">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#10AD0B]">
                                    Контакти та сервіс
                                </p>
                                <p className="mt-1 truncate text-sm font-medium text-white">
                                    Телефон, маршрут та зв&apos;язок у Telegram
                                </p>
                            </div>
                            <span className="ml-4 text-xl text-white">↗</span>
                        </button>

                        <input
                            type="text"
                            placeholder="Ваше ім'я"
                            required
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white focus:border-[#10AD0B] focus:outline-none"
                        />
                        <input
                            type="tel"
                            placeholder="Номер телефону"
                            required
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-3 text-white focus:border-[#10AD0B] focus:outline-none"
                        />
                        <p className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2 text-xs text-gray-400">
                            Ім'я підставляється автоматично з Telegram, але його можна змінити перед оформленням.
                        </p>
                        <p className="rounded-lg border border-[#10AD0B]/15 bg-[#10AD0B]/5 px-3 py-2 text-xs text-gray-300">
                            Кількість кожного товару в замовленні не може перевищувати актуальний залишок на складі.
                        </p>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="mt-2 w-full rounded-xl bg-[#10AD0B] py-4 font-bold text-white transition-colors hover:bg-[#0d9309] disabled:opacity-50"
                        >
                            {isSubmitting ? 'Оформлення...' : 'Підтвердити замовлення'}
                        </button>
                    </form>
                </div>
            )}
            </div>
        </div>
    );
};
