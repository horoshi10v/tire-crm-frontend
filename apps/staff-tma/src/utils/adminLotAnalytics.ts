import { isAxiosError } from 'axios';
import type { LotAnalyticsDailyPoint, LotAnalyticsLotRow, LotAnalyticsReportFilters } from '../types/adminReports';

export const createInitialLotAnalyticsFilters = (): LotAnalyticsReportFilters => ({
  start_date: undefined,
  end_date: undefined,
  warehouse_id: undefined,
  lot_id: undefined,
  type: undefined,
  brand: undefined,
  model: undefined,
  condition: undefined,
  source: undefined,
  group_by: 'DAY',
  top_limit: 10,
});

export const formatDateInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const shiftDays = (dateString: string, days: number): string => {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return formatDateInput(date);
};

export const calculatePreviousPeriodFilters = (filters: LotAnalyticsReportFilters): LotAnalyticsReportFilters | null => {
  if (!filters.start_date || !filters.end_date) {
    return null;
  }

  const start = new Date(`${filters.start_date}T00:00:00`);
  const end = new Date(`${filters.end_date}T00:00:00`);
  const diffMs = end.getTime() - start.getTime();
  if (Number.isNaN(diffMs) || diffMs < 0) {
    return null;
  }

  const rangeDays = Math.floor(diffMs / (24 * 60 * 60 * 1000)) + 1;

  return {
    ...filters,
    start_date: shiftDays(filters.start_date, -rangeDays),
    end_date: shiftDays(filters.end_date, -rangeDays),
  };
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatPercent = (value: number): string => `${formatNumber(value * 100)}%`;

export const buildLotLabel = (row: LotAnalyticsLotRow): string =>
  [row.brand, row.model].filter(Boolean).join(' · ') || row.lot_id;

export const buildDeltaValue = (current: number, previous: number): string => {
  if (previous === 0) {
    return current === 0 ? '0%' : 'new';
  }

  return `${current >= previous ? '+' : ''}${formatNumber(((current - previous) / previous) * 100)}%`;
};

export const buildDeltaTone = (current: number, previous: number): string => {
  if (current > previous) {
    return 'text-emerald-300';
  }
  if (current < previous) {
    return 'text-red-300';
  }
  return 'text-gray-300';
};

export const buildSourceMetricComparison = (current: number, previous: number) => ({
  current,
  previous,
  delta: buildDeltaValue(current, previous),
  deltaTone: buildDeltaTone(current, previous),
});

export const sortAnalyticsLots = <T extends { brand?: string; model?: string }>(lots: T[]): T[] => {
  return [...lots].sort((a, b) => {
    const left = `${a.brand ?? ''} ${a.model ?? ''}`.trim().toLowerCase();
    const right = `${b.brand ?? ''} ${b.model ?? ''}`.trim().toLowerCase();
    return left.localeCompare(right, 'uk');
  });
};

export const totalDailyPoint = (point: LotAnalyticsDailyPoint): number =>
  point.views + point.favorites_added + point.orders_created;

export const extractApiErrorMessage = (error: unknown): string => {
  if (!isAxiosError(error)) {
    return 'Невідома помилка. Спробуйте ще раз.';
  }

  const status = error.response?.status;
  const data = error.response?.data;

  if (typeof data === 'string' && data.trim()) {
    return `${status ? `HTTP ${status}: ` : ''}${data}`;
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const message =
      (typeof record.message === 'string' && record.message) ||
      (typeof record.error === 'string' && record.error) ||
      (typeof record.detail === 'string' && record.detail);

    if (message) {
      return `${status ? `HTTP ${status}: ` : ''}${message}`;
    }
  }

  return `${status ? `HTTP ${status}. ` : ''}${error.message || 'Помилка запиту до сервера.'}`;
};
