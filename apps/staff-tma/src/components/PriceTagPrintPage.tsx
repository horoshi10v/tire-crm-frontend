import { useEffect, useMemo, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
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
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
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

  const handleDownloadPdf = async () => {
    const pageElements = Array.from(document.querySelectorAll<HTMLElement>('[data-print-page]'));
    if (pageElements.length === 0 || isDownloadingPdf) {
      return;
    }

    setIsDownloadingPdf(true);

    try {
      const pdf = new jsPDF({
        orientation: format === 'a4' ? 'portrait' : 'portrait',
        unit: 'mm',
        format: format === 'a4' ? 'a4' : [100, 100],
        compress: true,
      });

      for (const [index, element] of pageElements.entries()) {
        const canvas = await html2canvas(element, {
          backgroundColor: '#ffffff',
          scale: Math.min(window.devicePixelRatio || 2, 3),
          useCORS: true,
        });
        const imageData = canvas.toDataURL('image/png');
        const pageWidth = format === 'a4' ? 210 : 100;
        const pageHeight = format === 'a4' ? 297 : 100;

        if (index > 0) {
          pdf.addPage(format === 'a4' ? 'a4' : [100, 100], 'portrait');
        }

        pdf.addImage(imageData, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
      }

      pdf.save(`price-tags-${format}.pdf`);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className={`text-black print:bg-white print:p-0 ${format === 'a4' ? 'bg-[#f5f5f5] p-4' : 'bg-[#ececec] p-3'}`}>
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          background: #ffffff;
        }
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
          onClick={() => void handleDownloadPdf()}
          disabled={isDownloadingPdf}
          className="rounded-lg border border-black bg-white px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isDownloadingPdf ? 'PDF...' : 'Скачати PDF'}
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
            data-print-page
            style={{
              breakAfter: pageIndex < pages.length - 1 ? 'page' : 'auto',
              pageBreakAfter: pageIndex < pages.length - 1 ? 'always' : 'auto',
            }}
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
                      : 'grid h-[100mm] w-[100mm] grid-rows-[auto_auto_1fr] px-[3.2mm] py-[4.8mm]'
                  }`}
                >
                  {format === 'thermal' ? (
                    <>
                      <div className="pb-[0.8mm]">
                        <div className="flex items-start justify-between gap-[1mm]">
                          <div>
                            <p className="text-[2.3mm] font-bold uppercase tracking-[0.18em] text-black/70">SHINA DP</p>
                            <p className="mt-[0.25mm] text-[2.1mm] font-bold uppercase tracking-[0.12em] text-black/55">Артикул</p>
                            <p className="mt-[0.2mm] text-[3.7mm] font-black leading-none">{buildLotCode(item.lotId)}</p>
                          </div>
                          <div className="flex flex-col gap-[0.8mm]">
                            {item.stock !== undefined ? (
                              <div className="min-w-[18mm] border-[0.25mm] border-black/70 px-[1mm] py-[0.7mm] text-center">
                                <p className="text-[1.9mm] font-bold uppercase tracking-[0.12em] text-black/60">В наявності</p>
                                <p className="mt-[0.2mm] text-[3.3mm] font-black leading-none">{item.stock} шт.</p>
                              </div>
                            ) : null}
                            {item.conditionLabel ? (
                              <div className="min-w-[18mm] border-[0.25mm] border-black/70 px-[1mm] py-[0.8mm] text-center">
                                <p className="text-[1.9mm] font-bold uppercase tracking-[0.12em] text-black/60">Стан</p>
                                <p className="mt-[0.2mm] text-[3.3mm] font-black leading-none">{item.conditionLabel}</p>
                              </div>
                            ) : null}
                          </div>
                        </div>

                        <p className="mt-[8mm] text-center text-[6mm] font-extrabold leading-[1.01] tracking-tight">
                          {[item.brand, item.title].filter(Boolean).join(' - ')}
                        </p>
                      </div>

                      <div className="grid min-h-0 grid-cols-[1fr_49mm] gap-[0.9mm] items-center self-center">
                        <div className="grid min-h-0 grid-rows-[auto_auto_auto] gap-[1.3mm] self-center">
                          {item.subtitle ? (
                            <div className="px-[0.2mm] py-[0.2mm]">
                              <p className="text-[2mm] font-bold uppercase tracking-[0.12em] text-black/55">
                                {item.kind === 'rim' ? 'Параметри диска' : item.kind === 'tire' ? 'Розмір шини' : 'Позиція'}
                              </p>
                              <p className="mt-[0.15mm] text-[5.8mm] font-black leading-tight">{item.subtitle}</p>
                            </div>
                          ) : (
                            <div />
                          )}
                          {item.kind === 'rim' ? (
                            <>
                              {item.technicalLine ? (
                                <div className="rounded-[1.6mm] border border-black/20 px-[1.5mm] py-[1.2mm] text-black">
                                  <p className="text-[1.9mm] font-bold uppercase tracking-[0.12em] text-black/55">Технічні дані</p>
                                  <p className="mt-[0.5mm] text-[3.1mm] font-black leading-tight">{item.technicalLine}</p>
                                </div>
                              ) : null}
                              {item.meta && item.meta.length > 0 ? (
                                <div className="rounded-[1.6mm] border border-black/20 px-[1.5mm] py-[1.2mm]">
                                  <p className="text-[1.9mm] font-bold uppercase tracking-[0.12em] text-black/55">Додатково</p>
                                  <div className="mt-[0.6mm] space-y-[0.45mm]">
                                    {item.meta.slice(0, 3).map((metaRow) => (
                                      <p key={metaRow} className="text-[2.25mm] font-semibold leading-tight text-black/80">
                                        {metaRow}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                            </>
                          ) : item.kind === 'tire' ? (
                            <>
                              {item.meta && item.meta.length > 0 ? (
                                <div className="rounded-[1.4mm] border border-black/20 px-[1.3mm] py-[1mm]">
                                  <p className="text-[1.9mm] font-bold uppercase tracking-[0.12em] text-black/55">Сезон / Рік / Країна</p>
                                  <p className="mt-[0.25mm] text-[3mm] font-black leading-tight">{item.meta.slice(0, 3).join(' / ')}</p>
                                </div>
                              ) : null}
                              {item.technicalLine ? (
                                <div className="rounded-[1.4mm] border border-black/20 px-[1.3mm] py-[0.9mm] text-black">
                                  <p className="text-[1.9mm] font-bold uppercase tracking-[0.12em] text-black/55">Опції шини</p>
                                  <p className="mt-[0.25mm] text-[3.2mm] font-black leading-tight">{item.technicalLine}</p>
                                </div>
                              ) : null}
                            </>
                          ) : (
                            <>
                              {item.meta && item.meta.length > 0 ? (
                                <div className="rounded-[1.6mm] border border-black/20 px-[1.5mm] py-[1.2mm]">
                                  <p className="text-[1.9mm] font-bold uppercase tracking-[0.12em] text-black/55">Характеристики</p>
                                  <div className="mt-[0.6mm] space-y-[0.45mm]">
                                    {item.meta.slice(0, 3).map((metaRow) => (
                                      <p key={metaRow} className="text-[2.25mm] font-semibold leading-tight text-black/80">
                                        {metaRow}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              ) : null}
                              {item.technicalLine ? (
                                <div className="rounded-[1.6mm] border border-black/20 px-[1.5mm] py-[1.2mm] text-black">
                                  <p className="text-[1.9mm] font-bold uppercase tracking-[0.12em] text-black/55">Деталі</p>
                                  <p className="mt-[0.5mm] text-[2.8mm] font-black leading-tight">{item.technicalLine}</p>
                                </div>
                              ) : null}
                            </>
                          )}

                          <div className="px-[0.3mm] py-[0.2mm] self-start">
                            <p className="text-[1.9mm] font-bold uppercase tracking-[0.12em] text-black/55">Ціна</p>
                            <p className="mt-[0.2mm] text-[8mm] font-black leading-none">{item.price}</p>
                          </div>
                        </div>

                        <div className="flex min-h-0 items-center justify-end p-0">
                          <div className="flex h-[49mm] w-[49mm] shrink-0 items-center justify-center overflow-hidden">
                            {item.qr ? (
                              <img src={item.qr} alt={`QR-код для ${item.title}`} className="h-full w-full object-contain" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center border border-black text-center text-[2.2mm]">
                                QR
                              </div>
                            )}
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
