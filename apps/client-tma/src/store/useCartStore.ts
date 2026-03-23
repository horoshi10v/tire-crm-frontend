// apps/client-tma/src/store/useCartStore.ts
import { create } from 'zustand';
import type { LotPublicResponse } from '../types/lot';

export interface CartItem {
    lot: LotPublicResponse;
    quantity: number;
}

export type AddItemResult = {
    added: boolean;
    reason?: 'limit_reached';
};

interface CartState {
    items: CartItem[];
    addItem: (lot: LotPublicResponse) => AddItemResult;
    removeItem: (lotId: string) => void;
    clearCart: () => void;
    getTotalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
    items: [],

    // Add a new item or increment quantity if it already exists
    addItem: (lot) => {
        const existingItem = get().items.find((item) => item.lot.id === lot.id);
        const currentQuantityInCart = existingItem?.quantity ?? 0;

        if (currentQuantityInCart >= lot.current_quantity) {
            return { added: false, reason: 'limit_reached' };
        }

        set((state) => {
            const stateExistingItem = state.items.find((item) => item.lot.id === lot.id);

            if (stateExistingItem) {
                return {
                    items: state.items.map((item) =>
                        item.lot.id === lot.id
                            ? { ...item, quantity: item.quantity + 1, lot }
                            : item
                    ),
                };
            }

            return { items: [...state.items, { lot, quantity: 1 }] };
        });

        return { added: true };
    },

    // Decrement quantity or remove item if quantity becomes 0
    removeItem: (lotId) => {
        set((state) => ({
            items: state.items
                .map((item) =>
                    item.lot.id === lotId
                        ? { ...item, quantity: item.quantity - 1 }
                        : item
                )
                .filter((item) => item.quantity > 0),
        }));
    },

    // Clear the entire cart (useful after a successful order)
    clearCart: () => set({ items: [] }),

    // Calculate the total price of all items in the cart
    getTotalPrice: () => {
        return get().items.reduce(
            (total, item) => total + item.lot.sell_price * item.quantity,
            0
        );
    },
}));
