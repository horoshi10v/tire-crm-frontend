import { useEffect, useMemo } from 'react';
import { decodePriceTagBatch, type PriceTagPrintItem } from '../utils/priceTagPrint';

const decodeParam = (value: string | null, fallback = ''): string => {
  if (!value) {
    return fallback;
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const decodeStringArray = (value: string | null): string[] => {
  if (!value) {
    return [];
  }

  try {
    const parsed = JSON.parse(decodeParam(value));
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string' && item.length > 0) : [];
  } catch {
    return [];
  }
};

export default function PriceTagPrintPage() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const hashParams = useMemo(() => new URLSearchParams(window.location.hash.replace(/^#/, '')), []);
  const payload = hashParams.get('payload');

  const items = useMemo<PriceTagPrintItem[]>(() => {
    if (payload) {
      const batchItems = decodePriceTagBatch(payload);
      if (batchItems.length > 0) {
        return batchItems;
      }
    }

    return [
      {
        title: decodeParam(params.get('title'), 'Цінник'),
        price: decodeParam(params.get('price'), '0 грн'),
        qr: params.get('qr') ?? '',
        subtitle: decodeParam(params.get('subtitle')),
        meta: decodeStringArray(params.get('meta')),
      },
    ];
  }, [params, payload]);

  const pages = useMemo(() => {
    const chunkSize = 8;
    const result: PriceTagPrintItem[][] = [];

    for (let index = 0; index < items.length; index += chunkSize) {
      result.push(items.slice(index, index + chunkSize));
    }

    return result;
  }, [items]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      window.print();
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-4 text-black print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-5xl justify-center gap-2 print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
        >
          Друк
        </button>
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back();
              return;
            }

            window.location.href = '/';
          }}
          className="rounded-lg border border-black px-4 py-2 text-sm font-semibold text-black"
        >
          Назад
        </button>
      </div>

      <div className="mx-auto flex max-w-[210mm] flex-col gap-4 print:max-w-none print:gap-0">
        {pages.map((page, pageIndex) => (
          <section
            key={`page-${pageIndex}`}
            className="rounded-xl bg-white p-[8mm] shadow-sm print:rounded-none print:p-[8mm] print:shadow-none"
          >
            <div className="grid grid-cols-2 gap-[4mm]">
              {page.map((item, itemIndex) => (
                <div
                  key={`${pageIndex}-${itemIndex}-${item.title}`}
                  className="flex min-h-[66mm] break-inside-avoid flex-col rounded-lg border-2 border-black bg-white p-3"
                >
                  <p className="text-center text-lg font-extrabold leading-tight tracking-tight">{item.title}</p>
                  {item.subtitle ? (
                    <p className="mt-1 text-center text-base font-semibold leading-tight">{item.subtitle}</p>
                  ) : null}
                  {item.meta && item.meta.length > 0 ? (
                    <p className="mt-2 text-center text-[11px] font-medium leading-snug text-gray-700">
                      {item.meta.join(' · ')}
                    </p>
                  ) : null}
                  <p className="mt-2 text-center text-3xl font-black leading-none">{item.price}</p>
                  <div className="mt-3 flex flex-1 items-center justify-center">
                    {item.qr ? (
                      <img src={item.qr} alt={`QR-код для ${item.title}`} className="h-36 w-36 object-contain" />
                    ) : (
                      <div className="flex h-36 w-36 items-center justify-center border border-black text-center text-[11px]">
                        QR недоступний
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
