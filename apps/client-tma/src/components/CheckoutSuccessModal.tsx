import { formatMoney } from '@tire-crm/shared';
import type { OrderResponse } from '../api/useOrders';

type CheckoutSuccessModalProps = {
    order: OrderResponse | null;
    onClose: () => void;
    onOpenOrder: (orderId: string) => void;
};

const formatOrderMoney = (value: number) => `${formatMoney(value)} грн`;

export const CheckoutSuccessModal = ({ order, onClose, onOpenOrder }: CheckoutSuccessModalProps) => {
    if (!order) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[96] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
            <div className="w-full max-w-sm overflow-hidden rounded-[28px] border border-[#10AD0B]/20 bg-[linear-gradient(180deg,rgba(6,12,6,0.96),rgba(10,18,10,0.98))] shadow-[0_28px_70px_rgba(0,0,0,0.45)]">
                <div className="px-5 py-5 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#10AD0B]/15 text-2xl text-[#10AD0B]">
                        ✓
                    </div>
                    <p className="mt-4 text-xs font-semibold uppercase tracking-[0.24em] text-[#10AD0B]">Замовлення прийнято</p>
                    <h2 className="mt-2 text-2xl font-bold text-white">Дякуємо за замовлення</h2>
                    <p className="mt-3 text-sm leading-6 text-gray-300">
                        Ми вже отримали вашу заявку. Менеджер зв&apos;яжеться з вами найближчим часом.
                    </p>

                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-left">
                        <p className="text-xs uppercase tracking-[0.18em] text-gray-500">Номер замовлення</p>
                        <p className="mt-2 font-semibold text-white">#{order.id.slice(0, 8)}</p>
                        <p className="mt-3 text-xs uppercase tracking-[0.18em] text-gray-500">Сума</p>
                        <p className="mt-2 font-semibold text-white">{formatOrderMoney(order.total_amount)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-white/10 px-4 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                        До каталогу
                    </button>
                    <button
                        type="button"
                        onClick={() => onOpenOrder(order.id)}
                        className="rounded-xl bg-[#10AD0B] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0d9309]"
                    >
                        Деталі замовлення
                    </button>
                </div>
            </div>
        </div>
    );
};
