export type PriceTagPrintItem = {
  title: string;
  price: string;
  qr: string;
};

export const formatSellPrice = (value: number): string => {
  return `${new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)} грн`;
};

const toBase64Url = (value: string): string => {
  return btoa(unescape(encodeURIComponent(value))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
};

const fromBase64Url = (value: string): string => {
  const padded = value.padEnd(Math.ceil(value.length / 4) * 4, '=').replaceAll('-', '+').replaceAll('_', '/');
  return decodeURIComponent(escape(atob(padded)));
};

export const encodePriceTagBatch = (items: PriceTagPrintItem[]): string => {
  return toBase64Url(JSON.stringify(items));
};

export const decodePriceTagBatch = (payload: string | null): PriceTagPrintItem[] => {
  if (!payload) {
    return [];
  }

  try {
    const parsed = JSON.parse(fromBase64Url(payload));
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is PriceTagPrintItem =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof item.title === 'string' &&
        typeof item.price === 'string' &&
        typeof item.qr === 'string',
    );
  } catch {
    return [];
  }
};

export const openPriceTagPrintUrl = (url: string): void => {
  const tg = (window as Window & {
    Telegram?: {
      WebApp?: {
        openLink?: (nextUrl: string, options?: { try_instant_view?: boolean }) => void;
      };
    };
  }).Telegram?.WebApp;

  if (tg?.openLink) {
    tg.openLink(url, { try_instant_view: false });
    return;
  }

  const printWindow = window.open(url, '_blank');
  if (!printWindow) {
    window.location.href = url;
  }
};
