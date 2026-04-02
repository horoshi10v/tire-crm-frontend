// apps/client-tma/src/components/LotDetailsModal.tsx
import { useState, useEffect } from 'react';
import { getLotPrimaryLabel } from '@tire-crm/shared';
import type { LotPublicResponse } from '../types/lot';
import type { AddItemResult } from '../store/useCartStore';
import { useCartStore } from '../store/useCartStore';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { ConfirmDialog } from './ConfirmDialog';

interface LotDetailsModalProps {
    lot: LotPublicResponse | null;
    onClose: () => void;
    onAddedToCart?: (lot: LotPublicResponse) => void;
    onAddToCartLimitReached?: (lot: LotPublicResponse, result: AddItemResult) => void;
    onCopyLink?: (lot: LotPublicResponse) => void | Promise<void>;
    onFavoriteChange?: (lot: LotPublicResponse, nextFavoriteState: boolean) => void;
    onView?: (lot: LotPublicResponse) => void;
}

// Хелпери для перекладу (стійкі до регістру)
const translateCondition = (c?: string) => {
    const upper = c?.toUpperCase();
    return upper === 'NEW' ? 'Нові' : upper === 'USED' ? 'Вживані' : c;
};
const translateType = (t?: string) => {
    const upper = t?.toUpperCase();
    return upper === 'TIRE' ? 'Шина' : upper === 'RIM' ? 'Диск' : upper === 'ACCESSORY' ? 'Супутній товар' : t;
};
const translateSeason = (s?: string) => {
    const upper = s?.toUpperCase();
    return upper === 'SUMMER' ? '☀️ Літо' : upper === 'WINTER' ? '❄️ Зима' : upper === 'ALL_SEASON' ? '🌤 Всесезонна' : '';
};
const translateAccessoryCategory = (value?: string) => {
    const upper = value?.toUpperCase();
    if (upper === 'FASTENERS') return 'Кріплення';
    if (upper === 'HUB_RINGS') return 'Проставочні кільця';
    if (upper === 'SPACERS') return 'Проставки';
    if (upper === 'TIRE_BAGS') return 'Пакети для шин';
    return '';
};
const translateFastenerType = (value?: string) => {
    const upper = value?.toUpperCase();
    if (upper === 'NUT') return 'Гайки';
    if (upper === 'BOLT') return 'Болти';
    return '';
};
const translateSpacerType = (value?: string) => {
    const upper = value?.toUpperCase();
    if (upper === 'ADAPTER') return 'Адаптер';
    if (upper === 'EXTENDER') return 'Розширювальна';
    return '';
};
const translateRimMaterial = (value?: string) => {
    const upper = value?.toUpperCase();
    if (upper === 'STEEL') return 'Металеві';
    if (upper === 'ALLOY') return 'Легкосплавні';
    return '';
};

type SpecRow = {
    label: string;
    value: string;
    accent?: boolean;
};

export const LotDetailsModal = ({ lot, onClose, onAddedToCart, onAddToCartLimitReached, onCopyLink, onFavoriteChange, onView }: LotDetailsModalProps) => {
    const addItem = useCartStore((state) => state.addItem);
    const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
    const isFavorite = useFavoritesStore((state) => (lot ? state.isFavorite(lot.id) : false));
    const [isOpen, setIsOpen] = useState(false);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);
    const [isRemoveFavoriteConfirmOpen, setIsRemoveFavoriteConfirmOpen] = useState(false);

    // Стейт для повноекранного фото
    const [fullScreenPhoto, setFullScreenPhoto] = useState<string | null>(null);

    // Блокування скролу на body
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // Якщо на iOS, то може знадобитись додатковий фікс, але overflow: hidden зазвичай працює
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    useEffect(() => {
        if (lot) {
            const timer = setTimeout(() => setIsOpen(true), 10);
            setActivePhotoIndex(0);
            return () => clearTimeout(timer);
        } else {
            setIsOpen(false);
            setFullScreenPhoto(null);
            setActivePhotoIndex(0);
        }
    }, [lot]);

    useEffect(() => {
        if (lot) {
            onView?.(lot);
        }
    }, [lot, onView]);

    if (!lot && !isOpen) return null;

    const currentLot = lot || ({} as LotPublicResponse);
    const photos = currentLot.photos ?? [];
    const hasPhotos = photos.length > 0;
    const activePhoto = hasPhotos ? photos[Math.min(activePhotoIndex, photos.length - 1)] : null;
    const isOutOfStock = currentLot.current_quantity === 0;
    const sizeLabel =
        currentLot.params?.width && currentLot.params?.profile && currentLot.params?.diameter
            ? `${currentLot.params.width}/${currentLot.params.profile} R${currentLot.params.diameter}`
            : currentLot.params?.diameter
              ? `R${currentLot.params.diameter}`
              : '';
    const formattedSellPrice = `${new Intl.NumberFormat('uk-UA', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(currentLot.sell_price ?? 0)} грн`;
    const primaryLabel = getLotPrimaryLabel(currentLot) || [currentLot.brand, currentLot.model].filter(Boolean).join(' ');
    const headlineLabel = [
        sizeLabel,
        currentLot.model,
        currentLot.params?.production_year ? `${currentLot.params.production_year}` : '',
    ]
        .filter(Boolean)
        .join(' · ');
    const specRows: SpecRow[] = [
        ...(sizeLabel ? [{ label: currentLot.type === 'RIM' ? 'Радіус R' : 'Розмір', value: sizeLabel }] : []),
        ...(currentLot.type === 'RIM' && currentLot.params?.width ? [{ label: 'Ширина J', value: `${currentLot.params.width}` }] : []),
        ...(currentLot.type === 'RIM' && currentLot.params?.rim_material && translateRimMaterial(currentLot.params.rim_material)
            ? [{ label: 'Сплав', value: translateRimMaterial(currentLot.params.rim_material) }]
            : []),
        ...(currentLot.params?.pcd ? [{ label: 'PCD', value: currentLot.params.pcd }] : []),
        ...(currentLot.params?.dia ? [{ label: 'DIA', value: `${currentLot.params.dia}` }] : []),
        ...(currentLot.params?.et || currentLot.params?.et === 0 ? [{ label: 'ET', value: `${currentLot.params.et}` }] : []),
        { label: 'В наявності', value: `${currentLot.current_quantity} шт.` },
        ...(currentLot.params?.season && translateSeason(currentLot.params.season)
            ? [{ label: 'Сезон', value: translateSeason(currentLot.params.season) }]
            : []),
        ...(currentLot.params?.tire_terrain ? [{ label: 'Тип шини', value: currentLot.params.tire_terrain === 'AT' ? 'A/T' : currentLot.params.tire_terrain === 'MT' ? 'M/T' : currentLot.params.tire_terrain }] : []),
        ...(currentLot.params?.production_year ? [{ label: 'Рік випуску', value: `${currentLot.params.production_year}` }] : []),
        ...(currentLot.params?.country_of_origin ? [{ label: 'Країна виробник', value: currentLot.params.country_of_origin }] : []),
        ...(currentLot.params?.is_c_type ? [{ label: 'Вантажна C', value: 'Так', accent: true }] : []),
        ...(currentLot.params?.accessory_category && translateAccessoryCategory(currentLot.params.accessory_category)
            ? [{ label: 'Категорія', value: translateAccessoryCategory(currentLot.params.accessory_category) }]
            : []),
        ...(currentLot.params?.is_run_flat ? [{ label: 'Run Flat', value: 'Так', accent: true }] : []),
        ...(currentLot.params?.is_spiked ? [{ label: 'Шипи', value: 'Так', accent: true }] : []),
        ...(currentLot.params?.anti_puncture ? [{ label: 'Антипрокол', value: 'Так', accent: true }] : []),
        ...(currentLot.params?.fastener_type && translateFastenerType(currentLot.params.fastener_type)
            ? [{ label: 'Тип кріплення', value: translateFastenerType(currentLot.params.fastener_type) }]
            : []),
        ...(currentLot.params?.thread_size ? [{ label: 'Різьба', value: currentLot.params.thread_size }] : []),
        ...(currentLot.params?.seat_type ? [{ label: 'Посадка', value: currentLot.params.seat_type }] : []),
        ...(currentLot.params?.ring_inner_diameter && currentLot.params?.ring_outer_diameter
            ? [{ label: 'Розмір кільця', value: `${currentLot.params.ring_inner_diameter}/${currentLot.params.ring_outer_diameter} мм` }]
            : []),
        ...(currentLot.params?.spacer_type && translateSpacerType(currentLot.params.spacer_type)
            ? [{ label: 'Тип проставки', value: translateSpacerType(currentLot.params.spacer_type) }]
            : []),
        ...(currentLot.params?.spacer_thickness ? [{ label: 'Товщина', value: `${currentLot.params.spacer_thickness} мм` }] : []),
        ...(currentLot.params?.package_quantity ? [{ label: 'У комплекті', value: `${currentLot.params.package_quantity} шт.` }] : []),
    ];
    const handleClose = () => {
        setIsOpen(false);
        window.setTimeout(onClose, 300);
    };

    const handleAddToCart = () => {
        const result = addItem(currentLot);
        if (!result.added) {
            onAddToCartLimitReached?.(currentLot, result);
            return;
        }

        onAddedToCart?.(currentLot);
        handleClose();
    };

    const handlePrevPhoto = () => {
        if (!hasPhotos) {
            return;
        }

        setActivePhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
    };

    const handleNextPhoto = () => {
        if (!hasPhotos) {
            return;
        }

        setActivePhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
    };

    const handleToggleFavorite = () => {
        if (isFavorite) {
            setIsRemoveFavoriteConfirmOpen(true);
            return;
        }

        const nextFavoriteState = !isFavorite;
        toggleFavorite(currentLot);
        onFavoriteChange?.(currentLot, nextFavoriteState);
    };

    const confirmRemoveFavorite = () => {
        setIsRemoveFavoriteConfirmOpen(false);
        toggleFavorite(currentLot);
        onFavoriteChange?.(currentLot, false);
    };

    return (
        <>
            {/* Головна модалка товару */}
            <div
                className={`fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0'
                }`}
                onClick={handleClose}
            >
                <div
                    className={`flex h-full w-full items-end justify-center overflow-hidden lg:items-center lg:p-10 ${
                        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
                    }`}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`relative flex h-full w-full flex-col bg-gray-950 transition-transform duration-300 ease-in-out overflow-y-auto sm:h-auto sm:max-h-[min(92vh,980px)] sm:overflow-hidden sm:rounded-[28px] sm:border sm:border-gray-800 sm:shadow-[0_28px_80px_rgba(0,0,0,0.5)] lg:h-[min(92vh,980px)] lg:items-stretch lg:overflow-hidden xl:max-w-6xl lg:flex-row lg:rounded-[28px] lg:border lg:border-gray-800 lg:shadow-[0_28px_80px_rgba(0,0,0,0.5)] ${
                            isOpen ? 'translate-y-0 lg:scale-100' : 'translate-y-full sm:translate-y-8 lg:translate-y-0 lg:scale-95'
                        }`}
                    >
                        {/* Кнопка закриття (Desktop absolute) */}
                        <button
                            onClick={handleClose}
                            className="fixed top-4 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-gray-700 bg-gray-900/80 text-xl text-white shadow-lg backdrop-blur transition-transform hover:bg-gray-800 active:scale-90 sm:absolute sm:right-4 sm:top-4"
                        >
                            ✕
                        </button>

                        {/* --- LEFT SIDE: PHOTOS (Desktop) / TOP (Mobile) --- */}
                        <div className="flex-shrink-0 bg-gray-900 lg:flex lg:h-full lg:w-[55%] lg:min-h-0 lg:flex-col lg:bg-black/40 lg:border-r lg:border-gray-800">
                             <div className="relative w-full aspect-square sm:aspect-[4/3] lg:min-h-0 lg:flex-1 lg:aspect-auto">
                                {activePhoto ? (
                                    <img
                                        src={activePhoto}
                                        alt={`${currentLot.brand} ${currentLot.model}`}
                                        onClick={() => setFullScreenPhoto(activePhoto)}
                                        className="h-full w-full object-contain cursor-zoom-in active:opacity-80 transition-opacity bg-gray-900 lg:bg-transparent"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center text-center text-gray-600">
                                        Немає фото
                                    </div>
                                )}

                                {photos.length > 1 ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handlePrevPhoto}
                                            className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-700 bg-gray-950/75 text-xl text-white backdrop-blur transition active:scale-95 lg:left-6"
                                        >
                                            ‹
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleNextPhoto}
                                            className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-700 bg-gray-950/75 text-xl text-white backdrop-blur transition active:scale-95 lg:right-6"
                                        >
                                            ›
                                        </button>
                                        <div className="absolute bottom-3 right-3 rounded-full border border-gray-700 bg-gray-950/80 px-3 py-1 text-xs font-medium text-gray-100 backdrop-blur lg:bottom-6 lg:right-6">
                                            {activePhotoIndex + 1} / {photos.length}
                                        </div>
                                    </>
                                ) : null}
                            </div>
                            {/* Thumbnails hidden on mobile, or maybe show them? Original code showed them below image */}
                            {/* Let's show thumbnails overlay or below on Desktop? Let's keep existing style for mobile, and allow thumbnails on desktop bottom */}
                            {photos.length > 1 && (
                                <div className="hide-scrollbar flex gap-2 overflow-x-auto px-4 py-3 bg-gray-900 lg:bg-transparent lg:justify-center lg:border-t lg:border-gray-800/50">
                                    {photos.map((photo, idx) => (
                                        <button
                                            key={photo}
                                            type="button"
                                            onClick={() => setActivePhotoIndex(idx)}
                                            className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border transition ${
                                                idx === activePhotoIndex
                                                    ? 'border-[#10AD0B] ring-2 ring-[#10AD0B]/30'
                                                    : 'border-gray-700'
                                            }`}
                                        >
                                            <img
                                                src={photo}
                                                alt={`${currentLot.brand} ${currentLot.model} ${idx + 1}`}
                                                className="h-full w-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* --- RIGHT SIDE: INFO (Desktop) / BOTTOM (Mobile) --- */}
                        <div className="relative flex flex-col sm:flex-1 sm:min-h-0 lg:h-full lg:min-h-0 lg:self-stretch">
                            <div className="pb-[110px] sm:flex-1 sm:overflow-y-auto sm:pb-[140px] lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pb-40 lg:p-6 lg:pt-12 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                                 <div className="flex flex-col gap-4 p-5 lg:p-0">
                                    <div>
                                        <div className="mb-1 flex items-start justify-between">
                                            <span className="text-sm font-medium text-gray-400">{currentLot.brand}</span>
                                            <span className="text-2xl font-bold text-[#10AD0B] lg:hidden">{formattedSellPrice}</span>
                                        </div>
                                        <h1 className="text-2xl font-bold leading-tight text-white lg:text-3xl">{headlineLabel || primaryLabel}</h1>
                                        <p className="mt-2 text-3xl font-bold text-[#10AD0B] hidden lg:block">{formattedSellPrice}</p>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        {currentLot.type && (
                                            <span className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-200">
                                                {translateType(currentLot.type)}
                                            </span>
                                        )}
                                        {currentLot.condition && (
                                            <span className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                                                currentLot.condition.toUpperCase() === 'NEW'
                                                    ? 'border-green-800 bg-green-900/30 text-green-400'
                                                    : 'border-yellow-800 bg-yellow-900/30 text-yellow-400'
                                            }`}>
                                                {translateCondition(currentLot.condition)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-2 rounded-xl border border-gray-800 bg-gray-900 p-4">
                                        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white">Характеристики</h3>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                                            {specRows.map((row) => (
                                                <div key={row.label} className="contents">
                                                    <div className="text-gray-400">{row.label}</div>
                                                    <div className={`text-right font-medium ${row.accent ? 'text-[#10AD0B]' : 'text-white'}`}>{row.value}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {currentLot.defects && (
                                        <div className="mt-2 rounded-xl border border-red-900/50 bg-red-950/30 p-4">
                                            <h3 className="mb-1 text-sm font-bold text-red-400">Опис стану / Дефекти:</h3>
                                            <p className="leading-relaxed text-sm text-red-200/80">{currentLot.defects}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                             {/* Footer fixed at bottom of right column */}
                            <div className="sticky bottom-0 z-20 border-t border-gray-900 bg-gray-950 p-4 pb-8 sm:absolute sm:bottom-0 sm:left-0 sm:right-0 sm:rounded-b-[28px] lg:absolute lg:bottom-0 lg:left-0 lg:right-0 lg:rounded-none lg:border-t lg:border-gray-800 lg:bg-gray-950/95 lg:pb-6 lg:pt-4 lg:backdrop-blur">
                                <div className="mb-3 flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => onCopyLink?.(currentLot)}
                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gray-700 bg-gray-900 text-base text-white transition hover:bg-gray-800 active:scale-[0.98]"
                                        aria-label="Скопіювати посилання"
                                    >
                                        ⧉
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleToggleFavorite}
                                        className={`min-w-0 flex-1 rounded-xl border py-3 font-semibold transition active:scale-[0.98] ${
                                            isFavorite
                                                ? 'border-[#10AD0B]/40 bg-[#10AD0B]/12 text-[#8ff38b]'
                                                : 'border-gray-700 bg-gray-900 text-white hover:bg-gray-800'
                                        }`}
                                    >
                                        {isFavorite ? 'Прибрати з обраного' : 'Додати в обране'}
                                    </button>
                                </div>
                                <button
                                    onClick={handleAddToCart}
                                    disabled={isOutOfStock}
                                    className="w-full rounded-xl bg-[#10AD0B] py-4 font-bold text-white shadow-lg shadow-[#10AD0B]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                                >
                                    {isOutOfStock ? 'Немає в наявності' : `Додати в кошик • ${formattedSellPrice}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Просмотрщик фото на весь екран (Lightbox) */}
            {fullScreenPhoto && (
                <div
                    className="fixed inset-0 z-[70] bg-black flex flex-col items-center justify-center animate-in fade-in duration-200"
                    onClick={() => setFullScreenPhoto(null)}
                >
                    <button
                        onClick={() => setFullScreenPhoto(null)}
                        className="absolute top-6 right-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white text-2xl backdrop-blur-md z-[71]"
                    >
                        &times;
                    </button>

                    <img
                        src={fullScreenPhoto}
                        alt="Full screen view"
                        className="w-full h-full object-contain cursor-zoom-out"
                    />
                </div>
            )}
            <ConfirmDialog
                isOpen={isRemoveFavoriteConfirmOpen}
                title="Прибрати товар з обраного?"
                description={primaryLabel.trim()}
                confirmLabel="Так"
                cancelLabel="Ні"
                onConfirm={confirmRemoveFavorite}
                onCancel={() => setIsRemoveFavoriteConfirmOpen(false)}
            />
        </>
    );
};
