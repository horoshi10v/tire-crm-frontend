import { useMemo } from 'react';
import { useLotQR } from '../api/staffLots';
import type { LotInternalResponse } from '../types/lot';

type PriceTagModalProps = {
  lot: LotInternalResponse | null;
  onClose: () => void;
};

const formatSellPrice = (value: number): string => {
  return `${new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)} грн`;
};

export default function PriceTagModal({ lot, onClose }: PriceTagModalProps) {
  const lotId = lot?.id ?? null;
  const { data: qrData, isLoading, isError } = useLotQR(lotId);
  const qrUrl = qrData?.objectUrl ?? null;

  const lotTitle = useMemo(() => {
    if (!lot) return '';
    return `${lot.brand} ${lot.model ?? ''}`.trim();
  }, [lot]);

  const handlePrint = () => {
    if (!lot) {
      return;
    }

    const printUrl = new URL('/print/price-tag', window.location.origin);
    printUrl.searchParams.set('title', lotTitle);
    printUrl.searchParams.set('price', formatSellPrice(lot.sell_price));
    if (qrData?.dataUrl) {
      printUrl.searchParams.set('qr', qrData.dataUrl);
    }

    const tg = (window as Window & {
      Telegram?: {
        WebApp?: {
          openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
        };
      };
    }).Telegram?.WebApp;

    if (tg?.openLink) {
      tg.openLink(printUrl.toString(), { try_instant_view: false });
      return;
    }

    const printWindow = window.open(printUrl.toString(), '_blank');
    if (!printWindow) {
      window.location.href = printUrl.toString();
    }
  };

  if (!lot) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[70] flex items-end justify-center bg-black/70 p-4 print:hidden sm:items-center"
        onClick={onClose}
      >
        <div
          className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-4 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Цінник</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2 py-1 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-gray-200"
            >
              Закрити
            </button>
          </div>

          <div className="rounded-2xl border border-gray-700 bg-gradient-to-br from-white to-slate-100 p-5 text-slate-900 shadow-inner">
            <p className="text-center text-2xl font-extrabold tracking-tight">{lotTitle}</p>
            <p className="mt-2 text-center text-4xl font-black">{formatSellPrice(lot.sell_price)}</p>
            <div className="mt-5 flex justify-center">
              {isLoading ? (
                <div className="flex h-40 w-40 items-center justify-center rounded-xl border border-slate-300 bg-white text-sm text-slate-500">
                  Завантаження QR...
                </div>
              ) : null}

              {isError ? (
                <div className="flex h-40 w-40 items-center justify-center rounded-xl border border-red-300 bg-red-50 px-3 text-center text-sm text-red-600">
                  Не вдалося завантажити QR-код
                </div>
              ) : null}

              {!isLoading && !isError && qrUrl ? (
                <img
                  src={qrUrl}
                  alt={`QR-код для ${lotTitle}`}
                  className="h-40 w-40 rounded-xl border border-slate-300 bg-white p-2"
                />
              ) : null}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Друк цінника
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-200 transition hover:bg-gray-700"
            >
              Скасувати
            </button>
          </div>
        </div>
      </div>

      <div className="hidden print:flex print:min-h-screen print:items-center print:justify-center print:bg-white">
        <div className="w-[88mm] rounded-xl border-2 border-black bg-white p-4 text-black">
          <p className="text-center text-2xl font-extrabold tracking-tight">{lotTitle}</p>
          <p className="mt-1 text-center text-5xl font-black leading-none">{formatSellPrice(lot.sell_price)}</p>
          <div className="mt-4 flex justify-center">
            {qrUrl ? (
              <img src={qrUrl} alt={`QR-код для ${lotTitle}`} className="h-44 w-44 object-contain" />
            ) : (
              <div className="flex h-44 w-44 items-center justify-center border border-black text-sm">QR недоступний</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
