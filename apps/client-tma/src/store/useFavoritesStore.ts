import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
            },

            removeFavorite: (lotId) => {
                set((state) => ({
                    items: state.items.filter((item) => item.id !== lotId),
                }));
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
