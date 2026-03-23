import { useState } from 'react';
import type { LotInternalResponse } from '../types/lot';

type LotDetailsModalProps = {
  lot: LotInternalResponse | null;
  warehouseLabel: string;
  onClose: () => void;
  onEdit: (lot: LotInternalResponse) => void;
  onOpenPriceTag: (lot: LotInternalResponse) => void;
};

const statusLabels: Record<string, string> = {
  ACTIVE: 'Активний',
  IN_STOCK: 'На складі',
  RESERVED: 'Зарезервовано',
  SOLD: 'Продано',
  ARCHIVED: 'Архів',
};

const formatMoney = (value: number): string => {
  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

export default function LotDetailsModal({ lot, warehouseLabel, onClose, onEdit, onOpenPriceTag }: LotDetailsModalProps) {
  const [activePhoto, setActivePhoto] = useState<string | null>(null);

  if (!lot) {
    return null;
  }

  const photos = lot.photos ?? [];
  const displayPhoto = activePhoto && photos.includes(activePhoto) ? activePhoto : photos[0] ?? null;
  const lotTitle = `${lot.brand} ${lot.model ?? ''}`.trim();

  return (
    <div className="fixed inset-0 z-[78] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-3">
          <h2 className="text-lg font-semibold text-white">Деталі лота</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-gray-200"
          >
            Закрити
          </button>
        </div>

        <div className="space-y-4 p-4 text-white">
          {displayPhoto ? (
            <img src={displayPhoto} alt={lotTitle} className="h-56 w-full rounded-xl border border-gray-800 object-cover" />
          ) : (
            <div className="flex h-56 w-full items-center justify-center rounded-xl border border-dashed border-gray-700 bg-gray-950 text-sm text-gray-500">
              Фото відсутнє
            </div>
          )}

          {photos.length > 1 ? (
            <div className="grid grid-cols-4 gap-2">
              {photos.map((photo) => (
                <button
                  key={photo}
                  type="button"
                  onClick={() => setActivePhoto(photo)}
                  className={`overflow-hidden rounded-lg border ${
                    displayPhoto === photo ? 'border-blue-500' : 'border-gray-700'
                  }`}
                >
                  <img src={photo} alt={lotTitle} className="h-20 w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}

          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-2xl font-bold text-white">{lotTitle}</h3>
              <p className="mt-1 text-xs text-gray-400">ID: {lot.id}</p>
            </div>
            <span className="rounded-full border border-gray-700 bg-gray-800 px-2.5 py-1 text-xs font-medium text-gray-200">
              {statusLabels[lot.status] ?? lot.status}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2 rounded-xl border border-gray-800 bg-gray-950 p-3 text-sm sm:grid-cols-2">
            <p>
              Склад: <span className="font-semibold text-white">{warehouseLabel}</span>
            </p>
            <p>
              Кількість: <span className="font-semibold text-white">{lot.current_quantity}</span>
            </p>
            <p>
              Тип: <span className="font-semibold text-white">{lot.type === 'TIRE' ? 'Шина' : 'Диск'}</span>
            </p>
            <p>
              Стан: <span className="font-semibold text-white">{lot.condition === 'NEW' ? 'Новий' : 'Вживаний'}</span>
            </p>
            <p>
              Закупівля: <span className="font-semibold text-white">{formatMoney(lot.purchase_price)}</span>
            </p>
            <p>
              Продаж: <span className="font-semibold text-white">{formatMoney(lot.sell_price)}</span>
            </p>
          </div>

          {lot.params ? (
            <div className="rounded-xl border border-gray-800 bg-gray-950 p-3 text-sm">
              <p className="mb-2 text-xs uppercase tracking-wider text-gray-400">Параметри</p>
              <div className="grid grid-cols-2 gap-2 text-gray-200">
                <p>Ширина: {lot.params.width ?? '—'}</p>
                <p>Профіль: {lot.params.profile ?? '—'}</p>
                <p>Діаметр: {lot.params.diameter ?? '—'}</p>
                <p>
                  Сезон:{' '}
                  {lot.params.season === 'SUMMER'
                    ? 'Літній'
                    : lot.params.season === 'WINTER'
                      ? 'Зимовий'
                      : lot.params.season === 'ALL_SEASON'
                        ? 'Всесезонний'
                        : '—'}
                </p>
                <p>Run Flat: {lot.params.is_run_flat ? 'Так' : 'Ні'}</p>
                <p>Шипована: {lot.params.is_spiked ? 'Так' : 'Ні'}</p>
                <p>Антипрокол: {lot.params.anti_puncture ? 'Так' : 'Ні'}</p>
              </div>
            </div>
          ) : null}

          {lot.defects ? (
            <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-3 text-sm text-amber-200">
              <p className="mb-1 text-xs uppercase tracking-wider text-amber-300">Дефекти</p>
              <p>{lot.defects}</p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={() => onEdit(lot)}
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-100 transition hover:bg-gray-700"
            >
              Редагувати
            </button>
            <button
              type="button"
              onClick={() => onOpenPriceTag(lot)}
              className="rounded-lg border border-blue-700/70 bg-blue-900/30 px-3 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-900/45"
            >
              Цінник
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
