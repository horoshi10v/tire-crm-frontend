// apps/client-tma/src/components/LotCard.tsx
import type { AddItemResult } from '../store/useCartStore';
import type { LotPublicResponse } from '../types/lot';
import { useCartStore } from '../store/useCartStore';

interface LotCardProps {
    lot: LotPublicResponse;
    onClick: () => void;
    onAddedToCart?: (lot: LotPublicResponse) => void;
    onAddToCartLimitReached?: (lot: LotPublicResponse, result: AddItemResult) => void;
}

export const LotCard = ({ lot, onClick, onAddedToCart, onAddToCartLimitReached }: LotCardProps) => {
    const addItem = useCartStore((state) => state.addItem);
    const isOutOfStock = lot.current_quantity === 0;
    const formattedPrice = `${new Intl.NumberFormat('uk-UA', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(lot.sell_price)} грн`;
    const typeLabel =
        lot.type === 'TIRE' ? 'Шини' : lot.type === 'RIM' ? 'Диски' : 'Супутні товари';
    const accessoryLabel =
        lot.params?.accessory_category === 'FASTENERS'
            ? 'Кріплення'
            : lot.params?.accessory_category === 'HUB_RINGS'
              ? 'Проставочні кільця'
              : lot.params?.accessory_category === 'SPACERS'
                ? 'Проставки'
                : lot.params?.accessory_category === 'TIRE_BAGS'
                  ? 'Пакети для шин'
                  : '';
    const metaLabel = lot.type === 'ACCESSORY' ? accessoryLabel || typeLabel : `${typeLabel} • ${lot.condition === 'NEW' ? 'Нові' : 'Вживані'}`;

    return (
        // Додаємо onClick на головний div і робимо курсор поінтером
        <div
            onClick={onClick}
            className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex flex-col cursor-pointer active:scale-[0.98] transition-transform"
        >
            <div className="h-32 bg-gray-800 flex items-center justify-center">
                {lot.photos && lot.photos.length > 0 ? (
                    <img src={lot.photos[0]} alt={lot.model} className="h-full w-full object-cover" />
                ) : (
                    <span className="text-gray-600 text-sm text-center">Немає фото</span>
                )}
            </div>
            <div className="p-3 flex flex-col flex-grow">
                <span className="text-xs text-gray-400 mb-1">
          {lot.brand} • {metaLabel}
        </span>
                <h2 className="text-sm font-semibold text-gray-100 flex-grow leading-tight mb-2">{lot.model}</h2>
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
