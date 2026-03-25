import { useEffect, useMemo } from 'react';

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

export default function PriceTagPrintPage() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);

  const title = decodeParam(params.get('title'), 'Цінник');
  const price = decodeParam(params.get('price'), '0 грн');
  const qr = params.get('qr') ?? '';

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      window.print();
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-4 text-black">
      <div className="w-[88mm] rounded-xl border-2 border-black bg-white p-4">
        <p className="text-center text-2xl font-extrabold tracking-tight">{title}</p>
        <p className="mt-2 text-center text-5xl font-black leading-none">{price}</p>
        <div className="mt-4 flex justify-center">
          {qr ? (
            <img src={qr} alt={`QR-код для ${title}`} className="h-44 w-44 object-contain" />
          ) : (
            <div className="flex h-44 w-44 items-center justify-center border border-black text-sm">QR недоступний</div>
          )}
        </div>

        <div className="mt-6 flex justify-center gap-2 print:hidden">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
          >
            Друк
          </button>
          <button
            type="button"
            onClick={() => window.close()}
            className="rounded-lg border border-black px-4 py-2 text-sm font-semibold text-black"
          >
            Закрити
          </button>
        </div>
      </div>
    </div>
  );
}
