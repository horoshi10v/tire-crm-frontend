// apps/client-tma/src/components/Header.tsx
import { useCartStore } from '../store/useCartStore';
import { useFavoritesStore } from '../store/useFavoritesStore';

interface HeaderProps {
    onOpenCart: () => void;
    onOpenProfile: () => void;
    onOpenBrandInfo: () => void;
}

export const Header = ({ onOpenCart, onOpenProfile, onOpenBrandInfo }: HeaderProps) => {
    const cartItems = useCartStore((state) => state.items);
    const totalFavorites = useFavoritesStore((state) => state.items.length);
    const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <header className="mb-4 flex items-center gap-3">
            <button
                type="button"
                onClick={onOpenBrandInfo}
                className="min-w-0 flex-1 overflow-hidden rounded-[20px] border border-white/10 bg-black px-4 py-2 text-left shadow-[0_12px_28px_rgba(0,0,0,0.38)] transition hover:border-[#10AD0B]/40 focus:outline-none focus:ring-2 focus:ring-[#10AD0B]/60"
                aria-label="Інформація про сервіс"
            >
                <div className="relative h-10 w-full sm:h-11">
                    <img
                        src="/brand.png"
                        alt="Логотип компанії"
                        className="h-full w-full object-contain object-center"
                    />
                </div>
            </button>
            <div className="flex gap-3">
                <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 p-2 text-xl">
                    <span aria-hidden="true">♥</span>
                    {totalFavorites > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-gray-950 bg-[#10AD0B] px-1 text-[10px] font-bold text-white">
                            {totalFavorites}
                        </span>
                    )}
                </div>
                <button
                    onClick={onOpenProfile}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 p-2 text-xl transition hover:bg-gray-700"
                    aria-label="Profile"
                >
                    👤
                </button>
                <button
                    onClick={onOpenCart}
                    className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gray-800 p-2 transition hover:bg-gray-700"
                    aria-label="Open Cart"
                >
                    <span className="text-xl">🛒</span>
                    {totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-gray-950 bg-[#10AD0B] text-[10px] font-bold text-white">
                            {totalItems}
                        </span>
                    )}
                </button>
            </div>
        </header>
    );
};
