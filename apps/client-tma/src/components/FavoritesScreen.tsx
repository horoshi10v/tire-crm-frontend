import { useEffect, useState } from 'react';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { LotCard } from './LotCard';
import { ConfirmDialog } from './ConfirmDialog';
import type { LotPublicResponse } from '../types/lot';

interface FavoritesScreenProps {
    onClose: () => void;
    onOpenLot: (lot: LotPublicResponse) => void;
    onAddedToCart: (lot: LotPublicResponse) => void;
    onAddToCartLimitReached: (lot: LotPublicResponse) => void;
}

export const FavoritesScreen = ({
    onClose,
    onOpenLot,
    onAddedToCart,
    onAddToCartLimitReached,
}: FavoritesScreenProps) => {
    const favoriteLots = useFavoritesStore((state) => state.items);
    const removeFavorite = useFavoritesStore((state) => state.removeFavorite);
    const clearFavorites = useFavoritesStore((state) => state.clearFavorites);
    const [isVisible, setIsVisible] = useState(false);
    const [removingIds, setRemovingIds] = useState<string[]>([]);
    const [pendingRemovalLot, setPendingRemovalLot] = useState<LotPublicResponse | null>(null);
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
    const [selectedType, setSelectedType] = useState('');
    const filteredFavoriteLots = selectedType
        ? favoriteLots.filter((lot) => lot.type === selectedType)
        : favoriteLots;

    useEffect(() => {
        const frameId = window.requestAnimationFrame(() => {
            setIsVisible(true);
        });

        return () => {
            window.cancelAnimationFrame(frameId);
        };
    }, []);

    const handleClose = () => {
        setIsVisible(false);
        window.setTimeout(onClose, 320);
    };

    const handleFavoriteToggle = (lot: LotPublicResponse, currentlyFavorite: boolean) => {
        if (!currentlyFavorite) {
            return;
        }

        setPendingRemovalLot(lot);
        return true;
    };

    const confirmLotRemoval = () => {
        if (!pendingRemovalLot) {
            return;
        }

        const lot = pendingRemovalLot;
        setPendingRemovalLot(null);
        setRemovingIds((state) => (state.includes(lot.id) ? state : [...state, lot.id]));
        window.setTimeout(() => {
            removeFavorite(lot.id);
            setRemovingIds((state) => state.filter((id) => id !== lot.id));
        }, 240);
    };

    const handleClearFavorites = () => {
        setIsClearConfirmOpen(true);
    };

    const confirmClearFavorites = () => {
        const ids = favoriteLots.map((lot) => lot.id);
        setIsClearConfirmOpen(false);
        setRemovingIds(ids);
        window.setTimeout(() => {
            clearFavorites();
            setRemovingIds([]);
        }, 240);
    };

    return (
        <div
            className="animate-screen-fade-in fixed inset-0 z-40 bg-gray-950 transition-[background-color,opacity] duration-300 ease-out"
            style={{
                opacity: isVisible ? 1 : 0,
                backgroundColor: isVisible ? 'rgba(3, 3, 3, 0.98)' : 'rgba(3, 3, 3, 0)',
            }}
            >
                <div
                className="flex h-full flex-col p-4 transition-transform duration-[360ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                    transform: isVisible ? 'translateY(0)' : 'translateY(40px)',
                    opacity: isVisible ? 1 : 0.92,
                }}
            >
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Обране</h2>
                        <p className="mt-1 text-sm text-gray-400">Збережено локально на цьому пристрої</p>
                    </div>
                    <button onClick={handleClose} className="text-2xl text-gray-400 hover:text-white">
                        &times;
                    </button>
                </div>

                {favoriteLots.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center rounded-2xl border border-gray-800 bg-gray-900/80 text-gray-500">
                        У вас ще немає обраних товарів.
                    </div>
                ) : (
                    <>
                        <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-gray-800 bg-gray-900/80 p-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#10AD0B]">
                                    Позицій в обраному
                                </p>
                                <p className="mt-1 text-2xl font-bold text-white">{favoriteLots.length}</p>
                            </div>
                            <button
                                type="button"
                                onClick={handleClearFavorites}
                                className="rounded-full border border-gray-700 bg-gray-950 px-4 py-2 text-sm font-medium text-gray-200 transition hover:bg-gray-800"
                            >
                                Очистити все
                            </button>
                        </div>

                        <div className="hide-scrollbar mb-4 flex gap-2 overflow-x-auto pb-1">
                            {[
                                { value: '', label: 'Усе' },
                                { value: 'TIRE', label: 'Шини' },
                                { value: 'RIM', label: 'Диски' },
                                { value: 'ACCESSORY', label: 'Супутні товари' },
                            ].map((option) => (
                                <button
                                    key={option.value || 'all'}
                                    type="button"
                                    onClick={() => setSelectedType(option.value)}
                                    className={`shrink-0 rounded-full border px-3 py-2 text-sm font-medium transition ${
                                        selectedType === option.value
                                            ? 'border-[#10AD0B]/30 bg-[#10AD0B]/15 text-[#8ff38b]'
                                            : 'border-gray-800 bg-gray-900 text-gray-300 hover:bg-gray-800'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>

                        <div className="hide-scrollbar flex-1 overflow-y-auto">
                            {filteredFavoriteLots.length === 0 ? (
                                <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-gray-800 bg-gray-900/60 text-center text-sm text-gray-500">
                                    У вибраній категорії немає товарів.
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                                    {filteredFavoriteLots.map((lot) => (
                                        <LotCard
                                            key={lot.id}
                                            lot={lot}
                                            animationDelayMs={Math.min(filteredFavoriteLots.findIndex((item) => item.id === lot.id) * 40, 240)}
                                            isRemoving={removingIds.includes(lot.id)}
                                            onClick={() => onOpenLot(lot)}
                                            onAddedToCart={onAddedToCart}
                                            onAddToCartLimitReached={onAddToCartLimitReached}
                                            onFavoriteToggle={handleFavoriteToggle}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            <ConfirmDialog
                isOpen={Boolean(pendingRemovalLot)}
                title="Прибрати товар з обраного?"
                description={pendingRemovalLot ? `${pendingRemovalLot.brand} ${pendingRemovalLot.model}`.trim() : undefined}
                confirmLabel="Так"
                cancelLabel="Ні"
                onConfirm={confirmLotRemoval}
                onCancel={() => setPendingRemovalLot(null)}
            />
            <ConfirmDialog
                isOpen={isClearConfirmOpen}
                title="Очистити все обране?"
                description="Усі збережені товари буде видалено з цього списку."
                confirmLabel="Так"
                cancelLabel="Ні"
                onConfirm={confirmClearFavorites}
                onCancel={() => setIsClearConfirmOpen(false)}
            />
        </div>
    );
};
