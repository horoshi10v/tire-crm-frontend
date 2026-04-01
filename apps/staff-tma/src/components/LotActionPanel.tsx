import type { LotInternalResponse } from '../types/lot';

type LotActionPanelProps = {
  lot: LotInternalResponse;
  onEdit?: (lot: LotInternalResponse) => void;
  onDelete?: (lot: LotInternalResponse) => void;
  onSell?: (lot: LotInternalResponse) => void;
  onOpenPriceTag?: (lot: LotInternalResponse) => void;
  compact?: boolean;
};

export default function LotActionPanel({
  lot,
  onEdit,
  onDelete,
  onSell,
  onOpenPriceTag,
  compact = false,
}: LotActionPanelProps) {
  const buttonClassName = compact
    ? 'rounded-lg border px-2 py-2 text-xs font-semibold transition'
    : 'rounded-lg border px-3 py-2 text-sm font-semibold transition';

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onEdit?.(lot);
        }}
        className={`${buttonClassName} border-gray-700 bg-gray-800 text-gray-100 hover:bg-gray-700`}
      >
        Редагувати
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onDelete?.(lot);
        }}
        className={`${buttonClassName} border-red-700/70 bg-red-900/25 text-red-200 hover:bg-red-900/40`}
      >
        Видалити
      </button>
      <button
        type="button"
        disabled={lot.current_quantity <= 0}
        onClick={(event) => {
          event.stopPropagation();
          onSell?.(lot);
        }}
        className={`${buttonClassName} border-emerald-700/70 bg-emerald-900/25 text-emerald-200 hover:bg-emerald-900/40 disabled:cursor-not-allowed disabled:opacity-40`}
      >
        Продати
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onOpenPriceTag?.(lot);
        }}
        className={`${buttonClassName} border-blue-700/70 bg-blue-900/30 text-blue-200 hover:bg-blue-900/45`}
      >
        Цінник
      </button>
    </div>
  );
}
