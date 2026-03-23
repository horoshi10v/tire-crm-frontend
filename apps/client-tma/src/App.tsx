// apps/client-tma/src/App.tsx
import { useState, useEffect } from 'react';
import { authenticateTelegramUser, useAuthStore } from '@tire-crm/shared';
import { useLots } from './api/useLots';
import { useFilterStore } from './store/useFilterStore';
import { useDebounce } from './hooks/useDebounce';
import type { LotPublicResponse } from './types/lot';

import { Header } from './components/Header';
import { LotCard } from './components/LotCard';
import { CartModal } from './components/CartModal';
import { Profile } from './components/Profile';
import { FiltersDrawer } from './components/FiltersDrawer';
import { LotDetailsModal } from './components/LotDetailsModal';
import { BrandLoader } from './components/BrandLoader';
import { ServiceInfoModal } from './components/ServiceInfoModal';
import { ToastAlert } from './components/ToastAlert';
import { CheckoutSuccessModal } from './components/CheckoutSuccessModal';

function App() {
    type FeedbackState = {
        title: string;
        description: string;
        variant: 'success' | 'error';
    };

    // Стейты для UI-шторок и модалок
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [isServiceInfoOpen, setIsServiceInfoOpen] = useState(false);
    const [toast, setToast] = useState<FeedbackState | null>(null);
    const [checkoutResult, setCheckoutResult] = useState<any | null>(null);
    const [profileSelectedOrderId, setProfileSelectedOrderId] = useState<string | null>(null);

    // Стейт для выбранного товара (для открытия на весь экран)
    const [selectedLot, setSelectedLot] = useState<LotPublicResponse | null>(null);

    // Стейт авторизации
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

    // Достаем фильтры
    const { filters, setFilter } = useFilterStore();

    // Debounce только для текстового поиска (500мс)
    const debouncedSearch = useDebounce(filters.search, 500);

    // Передаем в хук актуальные фильтры, search заменяем на debounced версию
    const { data: lots, isLoading: isCatalogLoading, isError } = useLots({
        ...filters,
        search: debouncedSearch
    });

    useEffect(() => {
        const initApp = async () => {
            try {
                await authenticateTelegramUser();
            } catch (error: any) {
                console.error('Auth error:', error);
                // alert('Auth Error: ' + (error.response?.data?.error || error.message)); // Розкоментувати для дебагу
            } finally {
                setIsAuthLoading(false);
            }
        };
        if (!isAuthenticated) initApp();
        else setIsAuthLoading(false);
    }, [isAuthenticated]);

    useEffect(() => {
        if (!toast) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setToast(null);
        }, 1300);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [toast]);

    if (isAuthLoading) {
        return <BrandLoader fullscreen message="Авторизація через Telegram..." />;
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(16,173,11,0.14),_transparent_42%),linear-gradient(180deg,_#070707_0%,_#050505_45%,_#020202_100%)] p-4 pb-24">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,rgba(16,173,11,0.1),transparent)]" />
            <Header
                onOpenCart={() => setIsCartOpen(true)}
                onOpenProfile={() => setIsProfileOpen(true)}
                onOpenBrandInfo={() => setIsServiceInfoOpen(true)}
            />

            {/* Головний пошук та кнопка фільтрів */}
            <div className="mb-6 flex gap-2">
                <div className="relative flex-grow">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input
                        type="text"
                        placeholder="Пошук за брендом чи моделлю..."
                        value={filters.search}
                        onChange={(e) => setFilter('search', e.target.value)}
                        className="w-full rounded-xl border border-gray-800 bg-gray-900 py-3 pl-10 pr-4 text-white transition-colors focus:border-[#10AD0B] focus:outline-none"
                    />
                </div>
                <button
                    onClick={() => setIsFiltersOpen(true)}
                    className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white hover:bg-gray-800 transition flex items-center justify-center"
                >
                    Фільтри
                </button>
            </div>

            <button
                type="button"
                onClick={() => setIsServiceInfoOpen(true)}
                className="mb-6 flex w-full items-center justify-between rounded-2xl border border-[#10AD0B]/20 bg-black/50 px-4 py-3 text-left transition hover:border-[#10AD0B]/40 hover:bg-black/65"
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

            {/* Каталог */}
            {isCatalogLoading ? (
                <BrandLoader message="Оновлюємо для вас актуальний каталог..." />
            ) : isError ? (
                <div className="text-center text-red-500 py-10">Помилка завантаження.</div>
            ) : !lots || lots.length === 0 ? (
                <div className="text-center text-gray-500 py-10">Товарів за вашим запитом не знайдено.</div>
            ) : (
                <div className="grid grid-cols-2 gap-4">
                    {lots.map((lot) => (
                        <LotCard
                            key={lot.id}
                            lot={lot}
                            onClick={() => setSelectedLot(lot)}
                            onAddedToCart={(addedLot) => {
                                setToast({
                                    title: 'Товар додано в кошик',
                                    description: `${addedLot.brand} ${addedLot.model}`.trim(),
                                    variant: 'success',
                                });
                            }}
                            onAddToCartLimitReached={(lot) => {
                                setToast({
                                    title: 'Недостатньо товару на складі',
                                    description: `Для "${lot.brand} ${lot.model}" доступно лише ${lot.current_quantity} шт.`,
                                    variant: 'error',
                                });
                            }}
                        />
                    ))}
                </div>
            )}

            {/* Модалки / Шторки (Рендеряться поверх всього) */}
            {isCartOpen && (
                <CartModal
                    isOpen={isCartOpen}
                    onClose={() => setIsCartOpen(false)}
                    onOpenServiceInfo={() => setIsServiceInfoOpen(true)}
                    onOrderSuccess={(order) => {
                        setCheckoutResult(order);
                    }}
                    onOrderError={(message) => {
                        setToast({
                            title: 'Не вдалося оформити замовлення',
                            description: message,
                            variant: 'error',
                        });
                    }}
                    onCartLimitReached={(message) => {
                        setToast({
                            title: 'Перевищено доступний залишок',
                            description: message,
                            variant: 'error',
                        });
                    }}
                />
            )}
            {isProfileOpen && (
                <Profile
                    onClose={() => {
                        setIsProfileOpen(false);
                        setProfileSelectedOrderId(null);
                    }}
                    initialSelectedOrderId={profileSelectedOrderId}
                />
            )}
            <ServiceInfoModal isOpen={isServiceInfoOpen} onClose={() => setIsServiceInfoOpen(false)} />

            {/* Повноекранна картка товару */}
            <LotDetailsModal
                lot={selectedLot}
                onClose={() => setSelectedLot(null)}
                onAddedToCart={(lot) => {
                    setToast({
                        title: 'Товар додано в кошик',
                        description: `${lot.brand} ${lot.model}`.trim(),
                        variant: 'success',
                    });
                }}
                onAddToCartLimitReached={(lot) => {
                    setToast({
                        title: 'Недостатньо товару на складі',
                        description: `Для "${lot.brand} ${lot.model}" доступно лише ${lot.current_quantity} шт.`,
                        variant: 'error',
                    });
                }}
            />

            {/* Шторка фільтрів (завжди в DOM для CSS анімацій) */}
            <FiltersDrawer isOpen={isFiltersOpen} onClose={() => setIsFiltersOpen(false)} />
            <ToastAlert
                isVisible={Boolean(toast)}
                title={toast?.title ?? ''}
                description={toast?.description}
                variant={toast?.variant}
                onClose={() => setToast(null)}
            />
            <CheckoutSuccessModal
                order={checkoutResult}
                onClose={() => setCheckoutResult(null)}
                onOpenOrder={(orderId) => {
                    setCheckoutResult(null);
                    setProfileSelectedOrderId(orderId);
                    setIsProfileOpen(true);
                }}
            />
        </div>
    );
}

export default App;
