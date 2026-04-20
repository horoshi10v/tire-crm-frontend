// apps/client-tma/src/components/LotCard.tsx
import { useEffect, useRef, useState } from 'react';
import { formatMoney, getLotPrimaryLabel, getLotTagLabels, getSearchHighlightTokens, SearchHighlightedText } from '@tire-crm/shared';
import type { AddItemResult } from '../store/useCartStore';
import type { LotPublicResponse } from '../types/lot';
import { useCartStore } from '../store/useCartStore';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { useFilterStore } from '../store/useFilterStore';

interface LotCardProps {
    lot: LotPublicResponse;
    animationDelayMs?: number;
    isRemoving?: boolean;
    favoriteButtonSide?: 'left' | 'right';
    onClick: () => void;
    onAddedToCart?: (lot: LotPublicResponse) => void;
    onAddToCartLimitReached?: (lot: LotPublicResponse, result: AddItemResult) => void;
    onFavoriteToggle?: (lot: LotPublicResponse, isFavorite: boolean) => boolean | void | Promise<boolean | void>;
}

export const LotCard = ({
    lot,
    animationDelayMs = 0,
    isRemoving = false,
    favoriteButtonSide = 'left',
    onClick,
    onAddedToCart,
    onAddToCartLimitReached,
    onFavoriteToggle,
}: LotCardProps) => {
    const addItem = useCartStore((state) => state.addItem);
    const toggleFavorite = useFavoritesStore((state) => state.toggleFavorite);
    const isFavorite = useFavoritesStore((state) => state.isFavorite(lot.id));
    const searchQuery = useFilterStore((state) => state.filters.search);
    const previousFavoriteRef = useRef(isFavorite);
    const [favoriteFx, setFavoriteFx] = useState<'adding' | 'removing' | null>(null);
    const isOutOfStock = lot.current_quantity === 0;
    const formattedPrice = `${formatMoney(lot.sell_price)} грн`;
    const primaryLabel = getLotPrimaryLabel(lot) || [lot.brand, lot.model].filter(Boolean).join(' ');
    const tags = getLotTagLabels(lot);
    const highlightTokens = getSearchHighlightTokens(searchQuery);
    const stockBadge =
        lot.current_quantity === 0
            ? {
                label: 'Немає',
                className: 'border-red-500/30 bg-red-500/12 text-red-300',
            }
            : lot.current_quantity <= 4
              ? {
                    label: `Залишилось ${lot.current_quantity}`,
                    className: 'border-amber-500/30 bg-amber-500/12 text-amber-300',
                }
              : {
                    label: 'В наявності',
                    className: 'border-[#10AD0B]/30 bg-[#10AD0B]/12 text-[#8ff38b]',
                };

    useEffect(() => {
        if (previousFavoriteRef.current !== isFavorite) {
            setFavoriteFx(isFavorite ? 'adding' : 'removing');
            const timeoutId = window.setTimeout(() => {
                setFavoriteFx(null);
            }, 320);
            previousFavoriteRef.current = isFavorite;
            return () => {
                window.clearTimeout(timeoutId);
            };
        }

        previousFavoriteRef.current = isFavorite;
        return undefined;
    }, [isFavorite]);

    return (
        <div
            onClick={onClick}
            style={{ ['--card-delay' as string]: `${animationDelayMs}ms` }}
            className={`animate-card-enter mx-auto flex h-full w-full max-w-[22rem] cursor-pointer flex-col overflow-hidden rounded-xl border border-gray-800 bg-gray-900 transition-transform active:scale-[0.98] ${
                isRemoving ? 'animate-favorite-card-out pointer-events-none' : ''
            }`}
        >
            <div className="relative aspect-[4/5] min-h-[12.5rem] bg-gray-800 md:min-h-[15rem] xl:min-h-[17rem] flex items-center justify-center">
                <button
                    type="button"
                    onClick={async (e) => {
                        e.stopPropagation();
                        setFavoriteFx(isFavorite ? 'removing' : 'adding');
                        const handled = await onFavoriteToggle?.(lot, isFavorite);

                        if (handled === true) {
                            return;
                        }

                        toggleFavorite(lot);
                    }}
                    className={`absolute top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border text-lg backdrop-blur transition ${
                        favoriteButtonSide === 'right' ? 'right-2' : 'left-2'
                    } ${
                        isFavorite
                            ? 'border-[#10AD0B]/50 bg-[#10AD0B]/20 text-[#8ff38b]'
                            : 'border-white/10 bg-black/55 text-white'
                    } ${favoriteFx === 'adding' ? 'animate-heart-pop' : ''} ${favoriteFx === 'removing' ? 'animate-heart-release' : ''}`}
                    aria-label={isFavorite ? 'Прибрати з обраного' : 'Додати в обране'}
                >
                    {isFavorite ? '♥' : '♡'}
                </button>
                {lot.photos && lot.photos.length > 0 ? (
                    <img src={lot.photos[0]} alt={lot.model} className="h-full w-full object-cover object-center" />
                ) : (
                    <span className="text-gray-600 text-sm text-center">Немає фото</span>
                )}
            </div>
            <div className="p-3 flex flex-col flex-grow">
                <div className="mb-2 flex flex-wrap gap-1.5">
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${stockBadge.className}`}>
                        {stockBadge.label}
                    </span>
                </div>
                <h2 className="mb-2 text-sm font-semibold leading-tight text-gray-100">
                    <SearchHighlightedText text={primaryLabel} tokens={highlightTokens} />
                </h2>
                {tags.length > 0 ? (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                        {tags.slice(0, 5).map((tag) => (
                            <span
                                key={tag}
                                className="rounded-full border border-gray-700 bg-gray-800 px-2 py-1 text-[10px] font-medium text-gray-200"
                            >
                                <SearchHighlightedText text={tag} tokens={highlightTokens} />
                            </span>
                        ))}
                    </div>
                ) : (
                    <div className="mb-3 flex-grow" />
                )}
                <div className="mt-auto flex items-center justify-between">
                    <span className="font-bold text-[#10AD0B]">{formattedPrice}</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            const result = addItem(lot);
                            if (result.added) {
                                onAddedToCart?.(lot);
                                return;
                            }
                            onAddToCartLimitReached?.(lot, result);
                        }}
                        disabled={isOutOfStock}
                        className="rounded-lg bg-[#10AD0B] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#0d9309] disabled:bg-gray-700"
                    >
                        {isOutOfStock ? 'Нема' : '+'}
                    </button>
                </div>
            </div>
        </div>
    );
};
