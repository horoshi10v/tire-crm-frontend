// apps/client-tma/src/components/LotDetailsModal.tsx
import { useState, useEffect } from 'react';
import type { LotPublicResponse } from '../types/lot';
import type { AddItemResult } from '../store/useCartStore';
import { useCartStore } from '../store/useCartStore';

interface LotDetailsModalProps {
    lot: LotPublicResponse | null;
    onClose: () => void;
    onAddedToCart?: (lot: LotPublicResponse) => void;
    onAddToCartLimitReached?: (lot: LotPublicResponse, result: AddItemResult) => void;
    onCopyLink?: (lot: LotPublicResponse) => void | Promise<void>;
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

export const LotDetailsModal = ({ lot, onClose, onAddedToCart, onAddToCartLimitReached, onCopyLink }: LotDetailsModalProps) => {
    const addItem = useCartStore((state) => state.addItem);
    const [isOpen, setIsOpen] = useState(false);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);

    // Стейт для повноекранного фото
    const [fullScreenPhoto, setFullScreenPhoto] = useState<string | null>(null);

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

    if (!lot && !isOpen) return null;

    const currentLot = lot || ({} as LotPublicResponse);
    const photos = currentLot.photos ?? [];
    const hasPhotos = photos.length > 0;
    const activePhoto = hasPhotos ? photos[Math.min(activePhotoIndex, photos.length - 1)] : null;
    const isOutOfStock = currentLot.current_quantity === 0;
    const formattedSellPrice = `${new Intl.NumberFormat('uk-UA', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(currentLot.sell_price ?? 0)} грн`;
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

    return (
        <>
            {/* Головна модалка товару */}
            <div
                className={`fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0'
                }`}
            >
                <div
                    className={`relative mx-auto flex h-full w-full max-w-4xl flex-col bg-gray-950 transition-transform duration-300 ease-in-out lg:border-x lg:border-gray-800 ${
                        isOpen ? 'translate-y-0' : 'translate-y-full'
                    }`}
                >
                {/* Sticky Header - вирівнювання по правому краю (justify-end) */}
                <div className="absolute top-0 left-0 right-0 z-10 flex justify-end items-center p-4 bg-gradient-to-b from-gray-950/80 to-transparent">
                    <button
                        onClick={handleClose}
                        className="w-10 h-10 rounded-full bg-gray-900/80 backdrop-blur flex items-center justify-center text-white text-xl border border-gray-700 shadow-lg active:scale-90 transition-transform"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto pb-28 hide-scrollbar">
                    <div className="border-b border-gray-800 bg-gray-900">
                        <div className="relative w-full aspect-square overflow-hidden">
                            {activePhoto ? (
                                <img
                                    src={activePhoto}
                                    alt={`${currentLot.brand} ${currentLot.model}`}
                                    onClick={() => setFullScreenPhoto(activePhoto)}
                                    className="h-full w-full cursor-zoom-in object-contain active:opacity-80 transition-opacity"
                                />
                            ) : (
                                <div className="flex h-full w-full shrink-0 snap-center items-center justify-center text-center text-gray-600">
                                    Немає фото
                                </div>
                            )}

                            {photos.length > 1 ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={handlePrevPhoto}
                                        className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-700 bg-gray-950/75 text-xl text-white backdrop-blur transition active:scale-95"
                                    >
                                        ‹
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleNextPhoto}
                                        className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-700 bg-gray-950/75 text-xl text-white backdrop-blur transition active:scale-95"
                                    >
                                        ›
                                    </button>
                                    <div className="absolute bottom-3 right-3 rounded-full border border-gray-700 bg-gray-950/80 px-3 py-1 text-xs font-medium text-gray-100 backdrop-blur">
                                        {activePhotoIndex + 1} / {photos.length}
                                    </div>
                                </>
                            ) : null}
                        </div>

                        {photos.length > 1 ? (
                            <div className="flex gap-2 overflow-x-auto px-4 py-3 hide-scrollbar">
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
                        ) : null}
                    </div>

                    <div className="p-5 flex flex-col gap-4">
                        <div>
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-sm text-gray-400 font-medium">{currentLot.brand}</span>
                                <span className="text-2xl font-bold text-[#10AD0B]">{formattedSellPrice}</span>
                            </div>
                            <h1 className="text-2xl font-bold text-white leading-tight">{currentLot.model}</h1>
                        </div>

                        {/* Беджі з перевірками */}
                        <div className="flex flex-wrap gap-2">
                            {currentLot.type && (
                                <span className="bg-gray-800 border border-gray-700 text-gray-200 text-xs px-3 py-1.5 rounded-lg font-medium">
                                    {translateType(currentLot.type)}
                                </span>
                            )}

                            {currentLot.condition && (
                                <span className={`border text-xs px-3 py-1.5 rounded-lg font-medium ${
                                    currentLot.condition.toUpperCase() === 'NEW'
                                        ? 'bg-green-900/30 border-green-800 text-green-400'
                                        : 'bg-yellow-900/30 border-yellow-800 text-yellow-400'
                                }`}>
                                    {translateCondition(currentLot.condition)}
                                </span>
                            )}

                            {/* Рендеримо тег сезону ТІЛЬКИ якщо переклад не порожній */}
                            {currentLot.params?.season && translateSeason(currentLot.params.season) !== '' && (
                                <span className="bg-gray-800 border border-gray-700 text-gray-200 text-xs px-3 py-1.5 rounded-lg font-medium">
                                    {translateSeason(currentLot.params.season)}
                                </span>
                            )}
                            {currentLot.params?.accessory_category && translateAccessoryCategory(currentLot.params.accessory_category) !== '' && (
                                <span className="bg-gray-800 border border-gray-700 text-gray-200 text-xs px-3 py-1.5 rounded-lg font-medium">
                                    {translateAccessoryCategory(currentLot.params.accessory_category)}
                                </span>
                            )}
                        </div>

                        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mt-2">
                            <h3 className="text-sm font-bold text-white mb-3 uppercase tracking-wider">Характеристики</h3>
                            <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                                {currentLot.params?.width && currentLot.params?.profile && currentLot.params?.diameter && (
                                    <>
                                        <div className="text-gray-400">Розмір</div>
                                        <div className="text-white font-medium text-right">{currentLot.params.width}/{currentLot.params.profile} R{currentLot.params.diameter}</div>
                                    </>
                                )}
                                <div className="text-gray-400">В наявності</div>
                                <div className="text-white font-medium text-right">{currentLot.current_quantity} шт.</div>

                                {currentLot.params?.is_run_flat && (
                                    <div className="col-span-2 flex justify-between">
                                        <span className="text-gray-400">Run Flat</span><span className="font-bold text-[#10AD0B]">Так</span>
                                    </div>
                                )}
                                {currentLot.params?.is_spiked && (
                                    <div className="col-span-2 flex justify-between">
                                        <span className="text-gray-400">Шипи</span><span className="font-bold text-[#10AD0B]">Так</span>
                                    </div>
                                )}
                                {currentLot.params?.anti_puncture && (
                                    <div className="col-span-2 flex justify-between">
                                        <span className="text-gray-400">Антипрокол</span><span className="font-bold text-[#10AD0B]">Так</span>
                                    </div>
                                )}
                                {currentLot.params?.fastener_type && (
                                    <>
                                        <div className="text-gray-400">Тип кріплення</div>
                                        <div className="text-white font-medium text-right">{translateFastenerType(currentLot.params.fastener_type)}</div>
                                    </>
                                )}
                                {currentLot.params?.thread_size && (
                                    <>
                                        <div className="text-gray-400">Різьба</div>
                                        <div className="text-white font-medium text-right">{currentLot.params.thread_size}</div>
                                    </>
                                )}
                                {currentLot.params?.seat_type && (
                                    <>
                                        <div className="text-gray-400">Посадка</div>
                                        <div className="text-white font-medium text-right">{currentLot.params.seat_type}</div>
                                    </>
                                )}
                                {currentLot.params?.ring_inner_diameter && currentLot.params?.ring_outer_diameter && (
                                    <>
                                        <div className="text-gray-400">Розмір кільця</div>
                                        <div className="text-white font-medium text-right">
                                            {currentLot.params.ring_inner_diameter}/{currentLot.params.ring_outer_diameter} мм
                                        </div>
                                    </>
                                )}
                                {currentLot.params?.spacer_type && (
                                    <>
                                        <div className="text-gray-400">Тип проставки</div>
                                        <div className="text-white font-medium text-right">{translateSpacerType(currentLot.params.spacer_type)}</div>
                                    </>
                                )}
                                {currentLot.params?.spacer_thickness && (
                                    <>
                                        <div className="text-gray-400">Товщина</div>
                                        <div className="text-white font-medium text-right">{currentLot.params.spacer_thickness} мм</div>
                                    </>
                                )}
                                {currentLot.params?.package_quantity && (
                                    <>
                                        <div className="text-gray-400">У комплекті</div>
                                        <div className="text-white font-medium text-right">{currentLot.params.package_quantity} шт.</div>
                                    </>
                                )}
                            </div>
                        </div>

                        {currentLot.defects && (
                            <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 mt-2">
                                <h3 className="text-sm font-bold text-red-400 mb-1">Опис стану / Дефекти:</h3>
                                <p className="text-sm text-red-200/80 leading-relaxed">{currentLot.defects}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 border-t border-gray-900 bg-gray-950 p-4 pb-8">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[220px,minmax(0,1fr)]">
                        <button
                            type="button"
                            onClick={() => onCopyLink?.(currentLot)}
                            className="rounded-xl border border-gray-700 bg-gray-900 py-4 font-semibold text-white transition hover:bg-gray-800 active:scale-[0.98]"
                        >
                            Скопіювати посилання
                        </button>
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
        </>
    );
};
