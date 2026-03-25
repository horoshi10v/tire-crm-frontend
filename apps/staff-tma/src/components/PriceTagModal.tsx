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

const escapeHtml = (value: string): string => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
};

export default function PriceTagModal({ lot, onClose }: PriceTagModalProps) {
  const lotId = lot?.id ?? null;
  const { data: qrUrl, isLoading, isError } = useLotQR(lotId);

  const lotTitle = useMemo(() => {
    if (!lot) return '';
    return `${lot.brand} ${lot.model ?? ''}`.trim();
  }, [lot]);

  const handlePrint = () => {
    if (!lot) {
      return;
    }

    const safeLotTitle = escapeHtml(lotTitle);
    const safePrice = escapeHtml(formatSellPrice(lot.sell_price));

    const qrMarkup = qrUrl
      ? `<img src="${qrUrl}" alt="QR-код для ${safeLotTitle}" style="width:176px;height:176px;object-fit:contain;" />`
      : '<div style="display:flex;height:176px;width:176px;align-items:center;justify-content:center;border:1px solid #111;font-size:14px;">QR недоступний</div>';

    const printHtml = `
      <!DOCTYPE html>
      <html lang="uk">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Цінник - ${lotTitle}</title>
          <style>
            * { box-sizing: border-box; }
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              font-family: Arial, sans-serif;
            }
            body {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 16px;
            }
            .tag {
              width: 88mm;
              border: 2px solid #111;
              border-radius: 12px;
              padding: 16px;
              color: #111;
              background: #fff;
            }
            .title {
              text-align: center;
              font-size: 28px;
              font-weight: 800;
              line-height: 1.1;
            }
            .price {
              margin-top: 8px;
              text-align: center;
              font-size: 48px;
              font-weight: 900;
              line-height: 1;
            }
            .qr {
              margin-top: 18px;
              display: flex;
              justify-content: center;
            }
            @media print {
              body { padding: 0; }
              .tag { border-color: #000; }
            }
          </style>
        </head>
        <body>
          <div class="tag">
            <div class="title">${safeLotTitle}</div>
            <div class="price">${safePrice}</div>
            <div class="qr">${qrMarkup}</div>
          </div>
        </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.className = 'pointer-events-none fixed bottom-0 right-0 h-0 w-0 border-0 opacity-0';

    const cleanup = () => {
      window.setTimeout(() => {
        iframe.remove();
      }, 500);
    };

    iframe.onload = () => {
      const printFrameWindow = iframe.contentWindow;
      if (!printFrameWindow) {
        cleanup();
        return;
      }

      window.setTimeout(() => {
        printFrameWindow.focus();
        printFrameWindow.print();
        cleanup();
      }, 250);
    };

    document.body.appendChild(iframe);
    iframe.srcdoc = printHtml;
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
