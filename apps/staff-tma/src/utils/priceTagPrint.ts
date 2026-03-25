import type { LotInternalResponse } from '../types/lot';

export type PriceTagPrintItem = {
  title: string;
  price: string;
  qr: string;
  subtitle?: string;
  meta?: string[];
};

export const formatSellPrice = (value: number): string => {
  return `${new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)} грн`;
};

const compactJoin = (...parts: Array<string | null | undefined>): string => {
  return parts.filter((part): part is string => Boolean(part && part.trim())).join(' · ');
};

const getSeasonLabel = (value?: string): string => {
  if (value === 'SUMMER') return 'Літо';
  if (value === 'WINTER') return 'Зима';
  if (value === 'ALL_SEASON') return 'Всесезон';
  return '';
};

const getAccessoryCategoryLabel = (value?: string): string => {
  if (value === 'FASTENERS') return 'Кріплення';
  if (value === 'HUB_RINGS') return 'Проставочні кільця';
  if (value === 'SPACERS') return 'Проставки';
  if (value === 'TIRE_BAGS') return 'Пакети для шин';
  return '';
};

const getFastenerTypeLabel = (value?: string): string => {
  if (value === 'NUT') return 'Гайки';
  if (value === 'BOLT') return 'Болти';
  return '';
};

const getSpacerTypeLabel = (value?: string): string => {
  if (value === 'ADAPTER') return 'Адаптер';
  if (value === 'EXTENDER') return 'Розширювальна';
  return '';
};

export const buildPriceTagDetails = (
  lot: LotInternalResponse,
): Pick<PriceTagPrintItem, 'subtitle' | 'meta'> => {
  if (lot.type === 'TIRE') {
    const subtitle =
      lot.params?.width && lot.params?.profile && lot.params?.diameter
        ? `${lot.params.width}/${lot.params.profile} R${lot.params.diameter}`
        : 'Шина';

    const meta = [
      getSeasonLabel(lot.params?.season),
      lot.condition === 'NEW' ? 'Нові' : 'Вживані',
      lot.params?.production_year ? `${lot.params.production_year} р.` : '',
      lot.params?.country_of_origin ?? '',
      lot.params?.is_run_flat ? 'Run Flat' : '',
      lot.params?.is_spiked ? 'Шип' : '',
      lot.params?.anti_puncture ? 'Антипрокол' : '',
    ].filter(Boolean);

    return { subtitle, meta };
  }

  if (lot.type === 'RIM') {
    const subtitle = lot.params?.diameter ? `R${lot.params.diameter}` : 'Диск';
    const meta = [
      lot.condition === 'NEW' ? 'Нові' : 'Вживані',
      lot.params?.production_year ? `${lot.params.production_year} р.` : '',
      lot.params?.country_of_origin ?? '',
    ].filter(Boolean);
    return { subtitle, meta };
  }

  const accessoryCategory = lot.params?.accessory_category;
  if (accessoryCategory === 'FASTENERS') {
    return {
      subtitle: getFastenerTypeLabel(lot.params?.fastener_type) || 'Кріплення',
      meta: [
        lot.params?.thread_size ?? '',
        lot.params?.seat_type ?? '',
        lot.params?.country_of_origin ?? '',
        lot.params?.package_quantity ? `Комплект ${lot.params.package_quantity} шт.` : '',
      ].filter(Boolean),
    };
  }

  if (accessoryCategory === 'HUB_RINGS') {
    return {
      subtitle:
        lot.params?.ring_inner_diameter && lot.params?.ring_outer_diameter
          ? `${lot.params.ring_inner_diameter}/${lot.params.ring_outer_diameter} мм`
          : getAccessoryCategoryLabel(accessoryCategory),
      meta: [lot.params?.country_of_origin ?? ''].filter(Boolean),
    };
  }

  if (accessoryCategory === 'SPACERS') {
    return {
      subtitle: compactJoin(
        getSpacerTypeLabel(lot.params?.spacer_type),
        lot.params?.spacer_thickness ? `${lot.params.spacer_thickness} мм` : '',
      ) || 'Проставки',
      meta: [lot.params?.country_of_origin ?? ''].filter(Boolean),
    };
  }

  if (accessoryCategory === 'TIRE_BAGS') {
    return {
      subtitle: 'Пакети для шин',
      meta: [
        lot.params?.package_quantity ? `Комплект ${lot.params.package_quantity} шт.` : '',
        lot.params?.country_of_origin ?? '',
      ].filter(Boolean),
    };
  }

  return {
    subtitle: getAccessoryCategoryLabel(accessoryCategory) || 'Супутній товар',
    meta: [lot.params?.country_of_origin ?? ''].filter(Boolean),
  };
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
        typeof item.qr === 'string' &&
        (item.subtitle === undefined || typeof item.subtitle === 'string') &&
        (item.meta === undefined ||
          (Array.isArray(item.meta) && item.meta.every((metaItem: unknown) => typeof metaItem === 'string'))),
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
