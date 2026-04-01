import { useEffect, useMemo } from 'react';
import {
  DEFAULT_PRICE_TAG_FORMAT,
  decodePriceTagBatch,
  type PriceTagPrintFormat,
  type PriceTagPrintItem,
} from '../utils/priceTagPrint';

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

const decodeNumber = (value: string | null): number | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseFloat(decodeParam(value));
  return Number.isFinite(parsed) ? parsed : undefined;
};

const normalizeKind = (value: string | null): PriceTagPrintItem['kind'] => {
  if (value === 'tire' || value === 'rim' || value === 'accessory') {
    return value;
  }

  return 'accessory';
};

const buildLotCode = (lotId?: string): string => {
  if (!lotId) {
    return '---';
  }

  return lotId.replaceAll('-', '').slice(-8).toUpperCase();
};

export default function PriceTagPrintPage() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const hashParams = useMemo(() => new URLSearchParams(window.location.hash.replace(/^#/, '')), []);
  const payload = hashParams.get('payload');
  const format = useMemo<PriceTagPrintFormat>(() => {
    const requestedFormat = params.get('format');
    return requestedFormat === 'a4' || requestedFormat === 'thermal' ? requestedFormat : DEFAULT_PRICE_TAG_FORMAT;
  }, [params]);

  const items = useMemo<PriceTagPrintItem[]>(() => {
    if (payload) {
      const batchItems = decodePriceTagBatch(payload);
      if (batchItems.length > 0) {
        return batchItems;
      }
    }

    return [
      {
        kind: normalizeKind(params.get('kind')),
        lotId: decodeParam(params.get('lot_id')),
        brand: decodeParam(params.get('brand')),
        stock: decodeNumber(params.get('stock')),
        title: decodeParam(params.get('title'), 'Цінник'),
        price: decodeParam(params.get('price'), '0 грн'),
        qr: params.get('qr') ?? '',
        subtitle: decodeParam(params.get('subtitle')),
        meta: decodeStringArray(params.get('meta')),
        conditionLabel: decodeParam(params.get('condition_label')),
        technicalLine: decodeParam(params.get('technical_line')),
      },
    ];
  }, [params, payload]);

  const pages = useMemo(() => {
    const chunkSize = format === 'a4' ? 8 : 1;
    const result: PriceTagPrintItem[][] = [];

    for (let index = 0; index < items.length; index += chunkSize) {
      result.push(items.slice(index, index + chunkSize));
    }

    return result;
  }, [format, items]);

  const buildPrintUrl = (nextFormat: PriceTagPrintFormat) => {
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('format', nextFormat);
    return nextUrl.toString();
  };

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      window.print();
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className={`min-h-screen text-black print:bg-white print:p-0 ${format === 'a4' ? 'bg-[#f5f5f5] p-4' : 'bg-[#ececec] p-3'}`}>
      <style>{`
        @page {
          size: ${format === 'a4' ? 'A4 portrait' : '100mm 100mm'};
          margin: 0;
        }
      `}</style>
      <div className="mx-auto mb-4 flex max-w-5xl justify-center gap-2 print:hidden">
        <button
          type="button"
          onClick={() => window.location.assign(buildPrintUrl('thermal'))}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            format === 'thermal' ? 'bg-blue-600 text-white' : 'border border-blue-500/40 bg-white text-blue-700'
          }`}
        >
          Термо 100×100
        </button>
        <button
          type="button"
          onClick={() => window.location.assign(buildPrintUrl('a4'))}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            format === 'a4' ? 'bg-blue-600 text-white' : 'border border-blue-500/40 bg-white text-blue-700'
          }`}
        >
          A4
        </button>
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

      <div
        className={`mx-auto flex flex-col ${
          format === 'a4' ? 'max-w-[210mm] gap-4 print:max-w-none print:gap-0' : 'max-w-[100mm] gap-3 print:max-w-none print:gap-0'
        }`}
      >
        {pages.map((page, pageIndex) => (
          <section
            key={`page-${pageIndex}`}
            className={`bg-white print:rounded-none print:shadow-none ${
              format === 'a4' ? 'rounded-xl p-[8mm] shadow-sm print:p-[8mm]' : 'overflow-hidden rounded-xl p-0 shadow-sm print:p-0'
            }`}
          >
            <div className={format === 'a4' ? 'grid grid-cols-2 gap-[4mm]' : 'grid grid-cols-1 gap-0'}>
              {page.map((item, itemIndex) => (
                <div
                  key={`${pageIndex}-${itemIndex}-${item.title}`}
                  className={`break-inside-avoid bg-white ${
                    format === 'a4'
                      ? `flex min-h-[66mm] flex-col rounded-lg border-2 border-black p-3 ${item.kind === 'rim' ? 'justify-between' : ''}`
                      : 'flex h-[100mm] w-[100mm] flex-col border-[1.5mm] border-black px-[5mm] py-[4.5mm]'
                  }`}
                >
                  {format === 'thermal' ? (
                    <>
                      <div className="border-b-[0.8mm] border-black pb-[2mm]">
                        <div className="flex items-start justify-between gap-[2mm]">
                          <div>
                            <p className="text-[2.6mm] font-bold uppercase tracking-[0.22em] text-black/70">SHINA DP</p>
                            <p className="mt-[0.8mm] text-[2.4mm] font-bold uppercase tracking-[0.14em] text-black/55">Артикул</p>
                            <p className="mt-[0.4mm] text-[4.4mm] font-black leading-none">{buildLotCode(item.lotId)}</p>
                          </div>
                          <div className="flex flex-col gap-[1mm]">
                            {item.stock !== undefined ? (
                              <div className="min-w-[23mm] border-[0.5mm] border-black px-[1.8mm] py-[1.2mm] text-center">
                                <p className="text-[2.2mm] font-bold uppercase tracking-[0.16em] text-black/60">В наявності</p>
                                <p className="mt-[0.5mm] text-[3.8mm] font-black leading-none">{item.stock} шт.</p>
                              </div>
                            ) : null}
                            {item.conditionLabel ? (
                              <div className="min-w-[23mm] border-[0.5mm] border-black px-[1.8mm] py-[1.4mm] text-center">
                                <p className="text-[2.3mm] font-bold uppercase tracking-[0.16em] text-black/60">Стан</p>
                                <p className="mt-[0.6mm] text-[3.8mm] font-black leading-none">{item.conditionLabel}</p>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {item.brand ? (
                          <p className="mt-[1.6mm] text-center text-[2.8mm] font-bold uppercase tracking-[0.22em] text-black/65">
                            {item.brand}
                          </p>
                        ) : null}

                        <p className="mt-[1.2mm] text-center text-[5.8mm] font-extrabold leading-[1.02] tracking-tight">
                          {item.title}
                        </p>
                      </div>

                      {item.subtitle ? (
                        <div className="border-b-[0.5mm] border-black py-[2mm]">
                          <p className="text-[2.5mm] font-bold uppercase tracking-[0.16em] text-black/60">
                            {item.kind === 'rim' ? 'Параметри диска' : item.kind === 'tire' ? 'Розмір шини' : 'Позиція'}
                          </p>
                          <p className="mt-[1mm] text-[4.4mm] font-semibold leading-tight">{item.subtitle}</p>
                        </div>
                      ) : null}

                      {item.kind === 'rim' && (item.technicalLine || (item.meta && item.meta.length > 0)) ? (
                        <div className="border-b-[0.5mm] border-black py-[2mm]">
                          <p className="text-[2.5mm] font-bold uppercase tracking-[0.16em] text-black/60">Технічні дані</p>
                          {item.technicalLine ? (
                            <div className="mt-[1.2mm] border-[0.6mm] border-black px-[1.5mm] py-[1.8mm] text-center">
                              <p className="text-[4.1mm] font-black leading-tight">{item.technicalLine}</p>
                            </div>
                          ) : null}
                          <div className="mt-[1.2mm] grid grid-cols-2 gap-[1mm]">
                            {(item.meta ?? []).slice(0, 4).map((metaRow) => (
                              <div
                                key={metaRow}
                                className="min-h-[7mm] border border-black/20 px-[1.2mm] py-[0.8mm] text-center text-[2.4mm] font-medium leading-tight text-black/70"
                              >
                                {metaRow}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {item.kind !== 'rim' && item.meta && item.meta.length > 0 ? (
                        <div className="border-b-[0.5mm] border-black py-[1.8mm]">
                          <p className="text-[2.5mm] font-bold uppercase tracking-[0.16em] text-black/60">
                            {item.kind === 'tire' ? 'Сезон / Рік / Країна' : 'Характеристики'}
                          </p>
                          {item.kind === 'tire' ? (
                            <div className="mt-[1mm] border-[0.5mm] border-black px-[1.5mm] py-[1.4mm] text-center">
                              <p className="text-[3.5mm] font-black leading-tight">{item.meta.slice(0, 3).join(' / ')}</p>
                            </div>
                          ) : (
                            <div className="mt-[1.2mm] grid grid-cols-2 gap-[1mm]">
                              {item.meta.slice(0, 4).map((metaRow) => (
                                <div
                                  key={metaRow}
                                  className="min-h-[8mm] border border-black/20 px-[1.2mm] py-[1mm] text-center text-[2.7mm] font-semibold leading-tight"
                                >
                                  {metaRow}
                                </div>
                              ))}
                            </div>
                          )}
                          {item.technicalLine ? (
                            <p className="mt-[1.3mm] text-center text-[2.8mm] font-bold leading-tight">{item.technicalLine}</p>
                          ) : null}
                        </div>
                      ) : null}

                      {item.kind === 'tire' && item.technicalLine ? (
                        <div className="border-b-[0.5mm] border-black py-[1.8mm]">
                          <p className="text-[2.5mm] font-bold uppercase tracking-[0.16em] text-black/60">Опції шини</p>
                          <div className="mt-[1mm] border-[0.6mm] border-black px-[1.5mm] py-[1.5mm] text-center">
                            <p className="text-[3.9mm] font-black leading-tight">{item.technicalLine}</p>
                          </div>
                        </div>
                      ) : null}

                      <div className="border-b-[0.8mm] border-black py-[2.2mm]">
                        <p className="text-center text-[2.5mm] font-bold uppercase tracking-[0.16em] text-black/60">Ціна</p>
                        <p className="mt-[0.8mm] text-center text-[9mm] font-black leading-none">{item.price}</p>
                      </div>

                      <div className="flex min-h-0 flex-1 flex-col justify-between pt-[2mm]">
                        <div className="flex items-center justify-center">
                          {item.qr ? (
                            <img src={item.qr} alt={`QR-код для ${item.title}`} className="h-[33mm] w-[33mm] object-contain" />
                          ) : (
                            <div className="flex h-[33mm] w-[33mm] items-center justify-center border border-black text-center text-[2.5mm]">
                              QR недоступний
                            </div>
                          )}
                        </div>
                        <div className="mt-[1.4mm] border-t-[0.5mm] border-dashed border-black pt-[1.2mm] text-center">
                          <p className="text-[2.6mm] font-bold uppercase tracking-[0.16em] text-black/60">Скануй QR</p>
                          <p className="mt-[0.6mm] text-[2.8mm] font-medium leading-tight">
                            Деталі товару та швидкий перехід
                          </p>
                          <div className="mt-[1.2mm] rounded border border-black px-[1.2mm] py-[0.9mm]">
                            <p className="font-mono text-[3.1mm] font-black uppercase tracking-[0.4em] leading-none">
                              {buildLotCode(item.lotId)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : item.kind === 'rim' ? (
                    <>
                      <div>
                        <p className="text-center text-lg font-extrabold leading-tight tracking-tight">{item.title}</p>
                        {item.subtitle ? (
                          <p className="mt-1 text-center text-base font-semibold leading-tight">{item.subtitle}</p>
                        ) : null}
                        {item.meta && item.meta.length > 0 ? (
                          <div className="mt-2 space-y-1">
                            <div className="grid grid-cols-2 gap-1 text-[11px] font-medium text-gray-800">
                              {item.meta.slice(0, Math.max(0, item.meta.length - 1)).map((metaRow) => (
                                <div key={metaRow} className="rounded border border-black/15 bg-black/[0.03] px-1.5 py-1 text-center">
                                  {metaRow}
                                </div>
                              ))}
                            </div>
                            {item.meta[item.meta.length - 1] ? (
                              <div className="rounded border border-black/20 bg-black/[0.04] px-2 py-1 text-center text-[11px] font-bold tracking-[0.14em] text-black">
                                {item.meta[item.meta.length - 1]}
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      <div>
                        <p className="mt-2 text-center text-3xl font-black leading-none">{item.price}</p>
                        <div className="mt-3 flex items-center justify-center">
                          {item.qr ? (
                            <img src={item.qr} alt={`QR-код для ${item.title}`} className="h-36 w-36 object-contain" />
                          ) : (
                            <div className="flex h-36 w-36 items-center justify-center border border-black text-center text-[11px]">
                              QR недоступний
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
