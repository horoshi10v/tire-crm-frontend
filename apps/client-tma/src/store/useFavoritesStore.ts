import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { trackLotAnalyticsEvent } from '../api/lotAnalytics';
import type { LotPublicResponse } from '../types/lot';

interface FavoritesState {
    items: LotPublicResponse[];
    toggleFavorite: (lot: LotPublicResponse) => void;
    removeFavorite: (lotId: string) => void;
    clearFavorites: () => void;
    syncLots: (lots: LotPublicResponse[]) => void;
    isFavorite: (lotId: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>()(
    persist(
        (set, get) => ({
            items: [],

            toggleFavorite: (lot) => {
                const exists = get().items.some((item) => item.id === lot.id);

                set((state) => ({
                    items: exists
                        ? state.items.filter((item) => item.id !== lot.id)
                        : [lot, ...state.items],
                }));

                void trackLotAnalyticsEvent({
                    lot_id: lot.id,
                    event_type: exists ? 'FAVORITE_REMOVE' : 'FAVORITE_ADD',
                }).catch(() => undefined);
            },

            removeFavorite: (lotId) => {
                const removedItem = get().items.find((item) => item.id === lotId);

                set((state) => ({
                    items: state.items.filter((item) => item.id !== lotId),
                }));

                if (removedItem) {
                    void trackLotAnalyticsEvent({
                        lot_id: removedItem.id,
                        event_type: 'FAVORITE_REMOVE',
                    }).catch(() => undefined);
                }
            },

            clearFavorites: () => {
                set({ items: [] });
            },

            syncLots: (lots) => {
                if (lots.length === 0) {
                    return;
                }

                set((state) => ({
                    items: state.items.map((item) => lots.find((lot) => lot.id === item.id) ?? item),
                }));
            },

            isFavorite: (lotId) => get().items.some((item) => item.id === lotId),
        }),
        {
            name: 'client-favorites-storage',
            partialize: (state) => ({ items: state.items }),
        }
    )
);
