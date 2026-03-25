// apps/client-tma/src/App.tsx
import { useState, useEffect, useMemo, useRef } from 'react';
import {
    authenticateTelegramUser,
    buildCatalogSearchHintChips,
    buildSuggestionSections,
    clearRecentSearches,
    createDefaultSearchSuggestionSectionsConfig,
    getSearchHighlightTokens,
    loadRecentSearches,
    saveRecentSearch,
    SearchSuggestionsDropdown,
    useAuthStore,
} from '@tire-crm/shared';
import { useLotSuggestions, useLots, useTrackLotSuggestionSelection } from './api/useLots';
import type { LotsSortParams } from './api/useLots';
import { useFilterStore } from './store/useFilterStore';
import { useFavoritesStore } from './store/useFavoritesStore';
import { useDebounce } from './hooks/useDebounce';
import { shareLotLink } from './utils/shareLotLink';
import type { LotPublicResponse } from './types/lot';

import { Header } from './components/Header';
import { LotCard } from './components/LotCard';
import { CartModal } from './components/CartModal';
import { Profile } from './components/Profile';
import { FavoritesScreen } from './components/FavoritesScreen';
import { FiltersDrawer } from './components/FiltersDrawer';
import { LotDetailsModal } from './components/LotDetailsModal';
import { BrandLoader } from './components/BrandLoader';
import { ServiceInfoModal } from './components/ServiceInfoModal';
import { ToastAlert } from './components/ToastAlert';
import { CheckoutSuccessModal } from './components/CheckoutSuccessModal';
import { ResponsiveSelect } from './components/ResponsiveSelect';

function App() {
    const sortOptions = [
        { value: 'DEFAULT', label: 'За замовчуванням' },
        { value: 'NEWEST', label: 'За новизною' },
        { value: 'PRICE_ASC', label: 'Ціна: від дешевих' },
        { value: 'PRICE_DESC', label: 'Ціна: від дорогих' },
        { value: 'IN_STOCK', label: 'Спочатку в наявності' },
    ] as const;
    const recentSearchConfig = {
        persistentKey: 'client-catalog-recent-searches',
        persistentLimit: 6,
        sessionKey: 'client-catalog-recent-searches-session',
        sessionLimit: 3,
    } as const;
    type FeedbackState = {
        title: string;
        description: string;
        variant: 'success' | 'error';
    };
    type SortOption = 'DEFAULT' | 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'IN_STOCK';

    // Стейты для UI-шторок и модалок
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [isServiceInfoOpen, setIsServiceInfoOpen] = useState(false);
    const [toast, setToast] = useState<FeedbackState | null>(null);
    const [checkoutResult, setCheckoutResult] = useState<any | null>(null);
    const [profileSelectedOrderId, setProfileSelectedOrderId] = useState<string | null>(null);
    const [sharedLotId, setSharedLotId] = useState<string | null>(() => {
        const params = new URLSearchParams(window.location.search);
        return params.get('lot');
    });
    const [sortOption, setSortOption] = useState<SortOption>('DEFAULT');
    const [showCatalogControlsReturn, setShowCatalogControlsReturn] = useState(false);
    const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const [recentSearches, setRecentSearches] = useState<string[]>(() => loadRecentSearches(recentSearchConfig));
    const isTouchDevice = useMemo(
        () => typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0),
        []
    );

    // Стейт для выбранного товара (для открытия на весь экран)
    const [selectedLot, setSelectedLot] = useState<LotPublicResponse | null>(null);

    // Стейт авторизации
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const favoriteLots = useFavoritesStore((state) => state.items);
    const syncFavoriteLots = useFavoritesStore((state) => state.syncLots);

    // Достаем фильтры
    const { filters, setFilter } = useFilterStore();

    // Debounce только для текстового поиска (500мс)
    const debouncedSearch = useDebounce(filters.search, 500);
    const debouncedSuggestionSearch = useDebounce(filters.search, 180);
    const suggestionSectionsConfig = useMemo(
        () => createDefaultSearchSuggestionSectionsConfig(!filters.search.trim()),
        [filters.search]
    );
    const sortParams = useMemo<LotsSortParams | undefined>(() => {
        switch (sortOption) {
            case 'PRICE_ASC':
                return { sort_by: 'price', sort_order: 'asc' };
            case 'PRICE_DESC':
                return { sort_by: 'price', sort_order: 'desc' };
            case 'IN_STOCK':
                return { sort_by: 'stock', sort_order: 'desc' };
            case 'NEWEST':
                return { sort_by: 'created_at', sort_order: 'desc' };
            case 'DEFAULT':
            default:
                return undefined;
        }
    }, [sortOption]);
    const searchHintChips = useMemo(() => buildCatalogSearchHintChips(filters.search), [filters.search]);

    // Передаем в хук актуальные фильтры, search заменяем на debounced версию
    const {
        data: lotsPages,
        isLoading: isCatalogLoading,
        isError,
        hasNextPage,
        isFetchingNextPage,
        fetchNextPage,
    } = useLots({
        ...filters,
        search: debouncedSearch
    }, sortParams);
    const lots = useMemo(
        () => lotsPages?.pages.flatMap((page) => page.items ?? []) ?? [],
        [lotsPages]
    );
    const searchContainerRef = useRef<HTMLDivElement | null>(null);
    const searchDropdownRef = useRef<HTMLDivElement | null>(null);
    const { data: searchSuggestions = [], isFetching: isSuggestionsLoading } = useLotSuggestions(
        {
            ...filters,
            search: debouncedSuggestionSearch.trim(),
        },
        8
    );
    const trackSuggestionSelection = useTrackLotSuggestionSelection();
    const quickSearchSuggestions = useMemo(
        () => (!filters.search.trim() ? searchSuggestions.slice(0, 6) : []),
        [filters.search, searchSuggestions]
    );
    const autocompleteSuggestions = useMemo(
        () => (filters.search.trim() ? searchSuggestions : []),
        [filters.search, searchSuggestions]
    );
    const suggestionSections = useMemo(
        () =>
            buildSuggestionSections(
                filters.search.trim() ? autocompleteSuggestions : quickSearchSuggestions,
                recentSearches,
                suggestionSectionsConfig
            ),
        [autocompleteSuggestions, quickSearchSuggestions, recentSearches, suggestionSectionsConfig]
    );
    const dropdownSuggestionItems = useMemo(
        () => suggestionSections.flatMap((section) => section.items),
        [suggestionSections]
    );
    const suggestionHighlightTokens = useMemo(() => getSearchHighlightTokens(filters.search), [filters.search]);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);
    const catalogControlsRef = useRef<HTMLDivElement | null>(null);

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

    useEffect(() => {
        syncFavoriteLots(lots ?? []);
    }, [lots, syncFavoriteLots]);

    useEffect(() => {
        setActiveSuggestionIndex(-1);
    }, [dropdownSuggestionItems]);

    useEffect(() => {
        if (!isSearchDropdownOpen) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            const targetNode = event.target as Node;
            if (
                !searchContainerRef.current?.contains(targetNode) &&
                !searchDropdownRef.current?.contains(targetNode)
            ) {
                setIsSearchDropdownOpen(false);
                setActiveSuggestionIndex(-1);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
        };
    }, [isSearchDropdownOpen]);

    useEffect(() => {
        const node = loadMoreRef.current;

        if (!node || !hasNextPage) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;

                if (entry?.isIntersecting && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            {
                rootMargin: '220px 0px',
            }
        );

        observer.observe(node);

        return () => {
            observer.disconnect();
        };
    }, [fetchNextPage, hasNextPage, isFetchingNextPage, lots.length]);

    useEffect(() => {
        const syncSharedLotFromUrl = () => {
            const params = new URLSearchParams(window.location.search);
            setSharedLotId(params.get('lot'));
        };

        window.addEventListener('popstate', syncSharedLotFromUrl);
        return () => {
            window.removeEventListener('popstate', syncSharedLotFromUrl);
        };
    }, []);

    useEffect(() => {
        const handleScroll = () => {
            setShowCatalogControlsReturn(window.scrollY > 720);
        };

        handleScroll();
        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    useEffect(() => {
        const url = new URL(window.location.href);

        if (selectedLot) {
            url.searchParams.set('lot', selectedLot.id);
        } else {
            url.searchParams.delete('lot');
        }

        window.history.replaceState({}, '', url);
    }, [selectedLot]);

    useEffect(() => {
        if (!sharedLotId || selectedLot?.id === sharedLotId) {
            return;
        }

        const sharedLot = [...(lots ?? []), ...favoriteLots].find((lot) => lot.id === sharedLotId);

        if (sharedLot) {
            setSelectedLot(sharedLot);
        }
    }, [favoriteLots, lots, selectedLot?.id, sharedLotId]);

    const handleCopyLotLink = async (lot: LotPublicResponse) => {
        try {
            const result = await shareLotLink(lot);
            setToast({
                title: result.method === 'share' ? 'Поділитися відкрито' : 'Посилання скопійовано',
                description: `${lot.brand} ${lot.model}`.trim(),
                variant: 'success',
            });
        } catch {
            setToast({
                title: 'Не вдалося скопіювати посилання',
                description: 'Спробуйте ще раз',
                variant: 'error',
            });
        }
    };

    const handleReturnToCatalogControls = () => {
        catalogControlsRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    };

    const applySearchSuggestion = (value: string) => {
        setRecentSearches(saveRecentSearch(recentSearchConfig, value));
        trackSuggestionSelection.mutate(value);
        setFilter('search', value);
        setIsSearchDropdownOpen(false);
        setActiveSuggestionIndex(-1);
    };

    if (isAuthLoading) {
        return <BrandLoader fullscreen message="Авторизація через Telegram..." />;
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(16,173,11,0.14),_transparent_42%),linear-gradient(180deg,_#070707_0%,_#050505_45%,_#020202_100%)] px-4 pb-24 pt-4">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[linear-gradient(180deg,rgba(16,173,11,0.1),transparent)]" />
            <div className="mx-auto w-full max-w-[1560px]">
                <Header
                    onOpenCart={() => setIsCartOpen(true)}
                    onOpenFavorites={() => setIsFavoritesOpen(true)}
                    onOpenProfile={() => setIsProfileOpen(true)}
                    onOpenBrandInfo={() => setIsServiceInfoOpen(true)}
                />

                <div className="xl:grid xl:grid-cols-[320px,minmax(0,1fr)] xl:gap-6">
                    <aside className="xl:sticky xl:top-4 xl:self-start">
                        <div ref={catalogControlsRef} className="mb-6 rounded-[28px] border border-white/10 bg-black/45 p-3 shadow-[0_24px_70px_rgba(0,0,0,0.28)] backdrop-blur-sm sm:p-4">
                            <div className="mb-3 flex gap-2">
                                <div ref={searchContainerRef} className="relative z-30 flex-grow">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                                    <input
                                        type="text"
                                        placeholder="Пошук за розміром, брендом, роком або станом..."
                                        value={filters.search}
                                        onChange={(e) => setFilter('search', e.target.value)}
                                        onFocus={() => {
                                            if (dropdownSuggestionItems.length > 0) {
                                                setIsSearchDropdownOpen(true);
                                            }
                                        }}
                                        onKeyDown={(event) => {
                                            if (isTouchDevice) {
                                                return;
                                            }
                                            const suggestions = dropdownSuggestionItems;
                                            if (suggestions.length === 0) {
                                                return;
                                            }

                                            if (event.key === 'ArrowDown') {
                                                event.preventDefault();
                                                setIsSearchDropdownOpen(true);
                                                setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
                                            } else if (event.key === 'ArrowUp') {
                                                event.preventDefault();
                                                setIsSearchDropdownOpen(true);
                                                setActiveSuggestionIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
                                            } else if (event.key === 'Enter') {
                                                if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
                                                    event.preventDefault();
                                                    applySearchSuggestion(suggestions[activeSuggestionIndex]);
                                                }
                                            } else if (event.key === 'Escape') {
                                                setIsSearchDropdownOpen(false);
                                                setActiveSuggestionIndex(-1);
                                            }
                                        }}
                                        className="w-full rounded-xl border border-gray-800 bg-gray-900 py-3 pl-10 pr-4 text-white transition-colors focus:border-[#10AD0B] focus:outline-none"
                                    />
                                    <SearchSuggestionsDropdown
                                        anchorRef={searchContainerRef}
                                        dropdownRef={searchDropdownRef}
                                        isOpen={isSearchDropdownOpen}
                                        isLoading={isSuggestionsLoading}
                                        sections={suggestionSections}
                                        activeSuggestionIndex={activeSuggestionIndex}
                                        highlightTokens={suggestionHighlightTokens}
                                        isTouchDevice={isTouchDevice}
                                        query={filters.search}
                                        onSelect={applySearchSuggestion}
                                        onHoverIndexChange={setActiveSuggestionIndex}
                                        onClearRecent={() => setRecentSearches(clearRecentSearches(recentSearchConfig))}
                                    />
                                </div>
                                <button
                                    onClick={() => setIsFiltersOpen(true)}
                                    className="flex items-center justify-center rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-white transition hover:bg-gray-800"
                                >
                                    Фільтри
                                </button>
                            </div>
                            {searchHintChips.length > 0 ? (
                                <div className="mb-3 flex flex-wrap gap-1.5">
                                    {searchHintChips.map((chip) => (
                                        <span
                                            key={chip}
                                            className="rounded-full border border-[#10AD0B]/20 bg-[#10AD0B]/10 px-2.5 py-1 text-[11px] font-medium text-[#b7f7b5]"
                                        >
                                            {chip}
                                        </span>
                                    ))}
                                </div>
                            ) : null}

                            <div className="hide-scrollbar mb-2 flex gap-2 overflow-x-auto pb-0.5 xl:flex-wrap xl:overflow-visible">
                                {[
                                    { value: '', label: 'Усе' },
                                    { value: 'TIRE', label: 'Шини' },
                                    { value: 'RIM', label: 'Диски' },
                                    { value: 'ACCESSORY', label: 'Супутні товари' },
                                ].map((option) => (
                                    <button
                                        key={option.value || 'all'}
                                        type="button"
                                        onClick={() => setFilter('type', option.value)}
                                        className={`shrink-0 rounded-full border px-3 py-2 text-sm font-medium transition ${
                                            filters.type === option.value
                                                ? 'border-[#10AD0B]/30 bg-[#10AD0B]/15 text-[#8ff38b]'
                                                : 'border-gray-800 bg-gray-900 text-gray-300 hover:bg-gray-800'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                            </div>

                            <ResponsiveSelect
                                value={sortOption}
                                onChange={(value) => setSortOption(value as SortOption)}
                                options={[...sortOptions]}
                                className="z-20"
                                mobileSelectClassName="border-gray-800 bg-gray-900 px-4 py-3"
                                desktopButtonClassName="border-gray-800 bg-gray-900 px-4 py-3"
                                dropdownClassName="border-gray-800 bg-gray-900"
                            />

                            <div className="mt-4">
                            <button
                                type="button"
                                onClick={() => setIsServiceInfoOpen(true)}
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
                            </div>
                        </div>

                    </aside>

                    <main>
                        {isCatalogLoading ? (
                            <BrandLoader message="Оновлюємо для вас актуальний каталог..." />
                        ) : isError ? (
                            <div className="py-10 text-center text-red-500">Помилка завантаження.</div>
                        ) : !lots.length ? (
                            <div className="py-10 text-center text-gray-500">Товарів за вашим запитом не знайдено.</div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 justify-items-center gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-3">
                                    {lots.map((lot) => (
                                        <LotCard
                                            key={lot.id}
                                            lot={lot}
                                            favoriteButtonSide="right"
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

                                <div ref={loadMoreRef} className="h-8" />

                                {(hasNextPage || isFetchingNextPage) && (
                                    <div className="mt-6 flex justify-center">
                                        <button
                                            type="button"
                                            onClick={() => fetchNextPage()}
                                            disabled={isFetchingNextPage}
                                            className="rounded-full border border-gray-800 bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {isFetchingNextPage ? 'Завантажуємо ще...' : 'Показати ще'}
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>

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
            {isFavoritesOpen && (
                <FavoritesScreen
                    onClose={() => setIsFavoritesOpen(false)}
                    onOpenLot={setSelectedLot}
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
                onClose={() => {
                    setSelectedLot(null);
                    setSharedLotId(null);
                }}
                onCopyLink={handleCopyLotLink}
                onFavoriteChange={(lot, nextFavoriteState) => {
                    if (!nextFavoriteState) {
                        return;
                    }

                    setToast({
                        title: 'Товар додано в обране',
                        description: `${lot.brand} ${lot.model}`.trim(),
                        variant: 'success',
                    });
                }}
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
            {showCatalogControlsReturn && (
                <button
                    type="button"
                    onClick={handleReturnToCatalogControls}
                    className="fixed bottom-5 right-4 z-30 rounded-full border border-[#10AD0B]/25 bg-gray-950/90 px-4 py-3 text-sm font-medium text-white shadow-[0_18px_45px_rgba(0,0,0,0.42)] backdrop-blur transition hover:bg-gray-900 xl:hidden"
                >
                    Повернути підбір
                </button>
            )}
        </div>
    );
}

export default App;
