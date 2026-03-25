export type PriceTagPrintItem = {
  title: string;
  price: string;
  qr: string;
};

export const PRICE_TAG_PRINT_STORAGE_PREFIX = 'staff-price-tag-print:';

export const formatSellPrice = (value: number): string => {
  return `${new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)} грн`;
};

export const savePriceTagBatch = (items: PriceTagPrintItem[]): string => {
  const batchKey = `${PRICE_TAG_PRINT_STORAGE_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  window.localStorage.setItem(batchKey, JSON.stringify(items));
  return batchKey;
};

export const loadPriceTagBatch = (batchKey: string): PriceTagPrintItem[] => {
  const rawValue = window.localStorage.getItem(batchKey);
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue);
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
