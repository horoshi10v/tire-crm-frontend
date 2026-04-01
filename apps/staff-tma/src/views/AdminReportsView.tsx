import { useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { useAdminLotAnalyticsReport, useAdminPnLReport, useExportInventory, useExportPnL } from '../api/adminReports';
import { useStaffLots } from '../api/staffLots';
import { useStaffOrders } from '../api/staffOrders';
import { useStaffWarehouses } from '../api/staffWarehouses';
import type { InventoryExportFilters, LotAnalyticsLotRow, LotAnalyticsReportFilters, PnLReportFilters } from '../types/adminReports';

type PnLFiltersState = {
  startDate: string;
  endDate: string;
  warehouseId: string;
  channel: '' | 'ONLINE' | 'OFFLINE';
};

type InventoryExportFormState = {
  search: string;
  brand: string;
  model: string;
  status: string;
  type: string;
  condition: string;
  season: string;
  warehouseId: string;
  width: string;
  profile: string;
  diameter: string;
  sellPrice: string;
  currentQuantity: string;
  isRunFlat: boolean;
  isSpiked: boolean;
  antiPuncture: boolean;
};

const createInitialPnLState = (): PnLFiltersState => ({
  startDate: '',
  endDate: '',
  warehouseId: '',
  channel: '',
});

const createInitialLotAnalyticsFilters = (): LotAnalyticsReportFilters => ({
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

const formatDateInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const shiftDays = (dateString: string, days: number): string => {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + days);
  return formatDateInput(date);
};

const calculatePreviousPeriodFilters = (filters: LotAnalyticsReportFilters): LotAnalyticsReportFilters | null => {
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

const createInitialInventoryExportState = (): InventoryExportFormState => ({
  search: '',
  brand: '',
  model: '',
  status: '',
  type: '',
  condition: '',
  season: '',
  warehouseId: '',
  width: '',
  profile: '',
  diameter: '',
  sellPrice: '',
  currentQuantity: '',
  isRunFlat: false,
  isSpiked: false,
  antiPuncture: false,
});

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

const formatPercent = (value: number): string => `${formatNumber(value * 100)}%`;

const buildLotLabel = (row: LotAnalyticsLotRow): string =>
  [row.brand, row.model].filter(Boolean).join(' · ') || row.lot_id;

const extractApiErrorMessage = (error: unknown): string => {
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

    const flattened = Object.values(record)
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .join('; ');

    if (flattened) {
      return `${status ? `HTTP ${status}: ` : ''}${flattened}`;
    }
  }

  return `${status ? `HTTP ${status}. ` : ''}${error.message || 'Помилка запиту до сервера.'}`;
};

export default function AdminReportsView() {
  const [topMetric, setTopMetric] = useState<'views' | 'favorites_added' | 'conversion_rate'>('views');
  const [pnlFilters, setPnlFilters] = useState<PnLFiltersState>(createInitialPnLState());
  const [appliedPnlFilters, setAppliedPnlFilters] = useState<PnLReportFilters>({});
  const [reportRequested, setReportRequested] = useState(false);
  const [lotAnalyticsFilters, setLotAnalyticsFilters] = useState<LotAnalyticsReportFilters>(createInitialLotAnalyticsFilters());
  const [appliedLotAnalyticsFilters, setAppliedLotAnalyticsFilters] = useState<LotAnalyticsReportFilters>({});
  const [lotAnalyticsRequested, setLotAnalyticsRequested] = useState(true);

  const [inventoryFilters, setInventoryFilters] = useState<InventoryExportFormState>(createInitialInventoryExportState());

  const [pnlError, setPnlError] = useState<string | null>(null);
  const [lotAnalyticsError, setLotAnalyticsError] = useState<string | null>(null);
  const [pnlExportError, setPnlExportError] = useState<string | null>(null);
  const [inventoryExportError, setInventoryExportError] = useState<string | null>(null);

  const [pnlExportUrl, setPnlExportUrl] = useState<string | null>(null);
  const [inventoryExportUrl, setInventoryExportUrl] = useState<string | null>(null);

  const { data: warehouses = [] } = useStaffWarehouses();
  const { data: lots = [] } = useStaffLots({ page: 1, pageSize: 500 });
  const { data: orders = [] } = useStaffOrders({ page: 1, pageSize: 100 });
  const {
    data: pnlReport,
    isLoading: isPnLLoading,
    isError: isPnLError,
    error: pnlRequestError,
  } = useAdminPnLReport(appliedPnlFilters, reportRequested);
  const {
    data: lotAnalyticsReport,
    isLoading: isLotAnalyticsLoading,
    isError: isLotAnalyticsRequestError,
    error: lotAnalyticsRequestError,
  } = useAdminLotAnalyticsReport(appliedLotAnalyticsFilters, lotAnalyticsRequested);
  const previousPeriodFilters = useMemo(
    () => calculatePreviousPeriodFilters(appliedLotAnalyticsFilters),
    [appliedLotAnalyticsFilters]
  );
  const {
    data: previousLotAnalyticsReport,
    isLoading: isPreviousLotAnalyticsLoading,
  } = useAdminLotAnalyticsReport(previousPeriodFilters ?? {}, lotAnalyticsRequested && Boolean(previousPeriodFilters));
  const {
    data: webAnalyticsReport,
    isLoading: isWebAnalyticsLoading,
  } = useAdminLotAnalyticsReport(
    { ...appliedLotAnalyticsFilters, source: 'WEB' },
    lotAnalyticsRequested
  );
  const {
    data: tmaAnalyticsReport,
    isLoading: isTmaAnalyticsLoading,
  } = useAdminLotAnalyticsReport(
    { ...appliedLotAnalyticsFilters, source: 'TMA' },
    lotAnalyticsRequested
  );
  const {
    data: staffAnalyticsReport,
    isLoading: isStaffAnalyticsLoading,
  } = useAdminLotAnalyticsReport(
    { ...appliedLotAnalyticsFilters, source: 'STAFF' },
    lotAnalyticsRequested
  );
  const {
    data: previousWebAnalyticsReport,
  } = useAdminLotAnalyticsReport(
    previousPeriodFilters ? { ...previousPeriodFilters, source: 'WEB' } : {},
    lotAnalyticsRequested && Boolean(previousPeriodFilters)
  );
  const {
    data: previousTmaAnalyticsReport,
  } = useAdminLotAnalyticsReport(
    previousPeriodFilters ? { ...previousPeriodFilters, source: 'TMA' } : {},
    lotAnalyticsRequested && Boolean(previousPeriodFilters)
  );
  const {
    data: previousStaffAnalyticsReport,
  } = useAdminLotAnalyticsReport(
    previousPeriodFilters ? { ...previousPeriodFilters, source: 'STAFF' } : {},
    lotAnalyticsRequested && Boolean(previousPeriodFilters)
  );
  const exportPnlMutation = useExportPnL();
  const exportInventoryMutation = useExportInventory();

  const dashboardStats = useMemo(() => {
    const lowStockLots = lots.filter((lot) => lot.current_quantity <= 4);
    const activeWarehouses = warehouses.filter((warehouse) => warehouse.is_active).length;
    const newOrders = orders.filter((order) => order.status === 'NEW').length;
    const inProgressOrders = orders.filter((order) => order.status === 'PREPAYMENT').length;
    const doneOrders = orders.filter((order) => order.status === 'DONE').length;
    const offlineOrders = orders.filter((order) => order.channel === 'OFFLINE').length;
    const onlineOrders = orders.filter((order) => order.channel === 'ONLINE').length;
    const doneOfflineOrders = orders.filter((order) => order.status === 'DONE' && order.channel === 'OFFLINE').length;
    const doneOnlineOrders = orders.filter((order) => order.status === 'DONE' && order.channel === 'ONLINE').length;
    const totalRevenue = orders
      .filter((order) => order.status === 'DONE')
      .reduce((acc, order) => acc + order.total_amount, 0);

    return {
      totalLots: lots.length,
      lowStockLots,
      activeWarehouses,
      newOrders,
      inProgressOrders,
      doneOrders,
      offlineOrders,
      onlineOrders,
      doneOfflineOrders,
      doneOnlineOrders,
      totalRevenue,
    };
  }, [lots, orders, warehouses]);

  const offlinePnL = useMemo(() => {
    return pnlReport?.by_channel?.find((row) => row.channel === 'OFFLINE') ?? null;
  }, [pnlReport]);

  const onlinePnL = useMemo(() => {
    return pnlReport?.by_channel?.find((row) => row.channel === 'ONLINE') ?? null;
  }, [pnlReport]);

  const analyticsLots = useMemo(() => {
    return [...lots].sort((a, b) => {
      const left = `${a.brand} ${a.model}`.trim().toLowerCase();
      const right = `${b.brand} ${b.model}`.trim().toLowerCase();
      return left.localeCompare(right, 'uk');
    });
  }, [lots]);

  const lotAnalyticsChartMax = useMemo(() => {
    return (lotAnalyticsReport?.daily ?? []).reduce((maxValue, point) => {
      return Math.max(maxValue, point.views, point.favorites_added, point.orders_created);
    }, 1);
  }, [lotAnalyticsReport]);

  const preparedLotAnalyticsDailyRows = useMemo(() => {
    return (lotAnalyticsReport?.daily ?? []).map((point) => ({
      ...point,
      total: point.views + point.favorites_added + point.orders_created,
      conversionRate: point.views > 0 ? point.orders_created / point.views : 0,
      viewWidth: `${(point.views / lotAnalyticsChartMax) * 100}%`,
      favoriteWidth: `${(point.favorites_added / lotAnalyticsChartMax) * 100}%`,
      orderWidth: `${(point.orders_created / lotAnalyticsChartMax) * 100}%`,
    }));
  }, [lotAnalyticsChartMax, lotAnalyticsReport]);

  const stackedLotAnalyticsDailyRows = useMemo(() => {
    const previousDailyRows = previousLotAnalyticsReport?.daily ?? [];
    const maxTotal = Math.max(
      1,
      ...preparedLotAnalyticsDailyRows.map((point) => point.total),
      ...previousDailyRows.map((point) => point.views + point.favorites_added + point.orders_created)
    );

    return preparedLotAnalyticsDailyRows.map((point) => {
      const totalWidth = (point.total / maxTotal) * 100;
      const safeTotal = Math.max(point.total, 1);
      const previousPoint = previousDailyRows.find((previousRow) => previousRow.date === point.date) ?? null;
      const previousTotal = previousPoint
        ? previousPoint.views + previousPoint.favorites_added + previousPoint.orders_created
        : 0;

      return {
        ...point,
        totalWidth: `${totalWidth}%`,
        previousTotal,
        previousTotalWidth: `${(previousTotal / maxTotal) * 100}%`,
        stackedViewWidth: `${(point.views / safeTotal) * 100}%`,
        stackedFavoriteWidth: `${(point.favorites_added / safeTotal) * 100}%`,
        stackedOrderWidth: `${(point.orders_created / safeTotal) * 100}%`,
      };
    });
  }, [preparedLotAnalyticsDailyRows, previousLotAnalyticsReport]);

  const conversionChartMax = useMemo(() => {
    return preparedLotAnalyticsDailyRows.reduce((maxValue, point) => Math.max(maxValue, point.conversionRate), 0);
  }, [preparedLotAnalyticsDailyRows]);

  const preparedConversionRows = useMemo(() => {
    const safeMax = conversionChartMax > 0 ? conversionChartMax : 1;
    return preparedLotAnalyticsDailyRows.map((point) => ({
      ...point,
      conversionWidth: `${(point.conversionRate / safeMax) * 100}%`,
    }));
  }, [conversionChartMax, preparedLotAnalyticsDailyRows]);

  const lotAnalyticsPeriodLabel = useMemo(() => {
    switch (appliedLotAnalyticsFilters.group_by ?? 'DAY') {
      case 'WEEK':
        return 'тижнях';
      case 'MONTH':
        return 'місяцях';
      default:
        return 'днях';
    }
  }, [appliedLotAnalyticsFilters.group_by]);

  const buildDeltaValue = (current: number, previous: number): string => {
    if (previous === 0) {
      return current === 0 ? '0%' : 'new';
    }
    return `${current >= previous ? '+' : ''}${formatNumber(((current - previous) / previous) * 100)}%`;
  };

  const buildDeltaTone = (current: number, previous: number): string => {
    if (current > previous) {
      return 'text-emerald-300';
    }
    if (current < previous) {
      return 'text-red-300';
    }
    return 'text-gray-300';
  };

  const sourceBreakdownCards = useMemo(
    () => [
      {
        key: 'WEB',
        title: 'WEB',
        report: webAnalyticsReport,
        previousReport: previousWebAnalyticsReport,
        accentClass: 'border-blue-700/30 bg-blue-500/10',
        labelClass: 'text-blue-200/80',
      },
      {
        key: 'TMA',
        title: 'TMA',
        report: tmaAnalyticsReport,
        previousReport: previousTmaAnalyticsReport,
        accentClass: 'border-emerald-700/30 bg-emerald-500/10',
        labelClass: 'text-emerald-200/80',
      },
      {
        key: 'STAFF',
        title: 'STAFF',
        report: staffAnalyticsReport,
        previousReport: previousStaffAnalyticsReport,
        accentClass: 'border-amber-700/30 bg-amber-500/10',
        labelClass: 'text-amber-200/80',
      },
    ],
    [
      previousStaffAnalyticsReport,
      previousTmaAnalyticsReport,
      previousWebAnalyticsReport,
      staffAnalyticsReport,
      tmaAnalyticsReport,
      webAnalyticsReport,
    ]
  );

  const buildSourceMetricComparison = (current: number, previous: number) => ({
    current,
    previous,
    delta: buildDeltaValue(current, previous),
    deltaTone: buildDeltaTone(current, previous),
  });

  const comparisonCards = useMemo(() => {
    if (!lotAnalyticsReport || !previousLotAnalyticsReport || !previousPeriodFilters) {
      return [];
    }

    const buildDelta = (current: number, previous: number) => {
      if (previous === 0) {
        return current === 0 ? '0%' : 'new';
      }
      return `${current >= previous ? '+' : ''}${formatNumber(((current - previous) / previous) * 100)}%`;
    };

    return [
      {
        key: 'views',
        title: 'Перегляди',
        current: lotAnalyticsReport.totals.views,
        previous: previousLotAnalyticsReport.totals.views,
        delta: buildDelta(lotAnalyticsReport.totals.views, previousLotAnalyticsReport.totals.views),
        deltaTone: buildDeltaTone(lotAnalyticsReport.totals.views, previousLotAnalyticsReport.totals.views),
      },
      {
        key: 'favorites',
        title: 'Збереження',
        current: lotAnalyticsReport.totals.favorites_added,
        previous: previousLotAnalyticsReport.totals.favorites_added,
        delta: buildDelta(lotAnalyticsReport.totals.favorites_added, previousLotAnalyticsReport.totals.favorites_added),
        deltaTone: buildDeltaTone(lotAnalyticsReport.totals.favorites_added, previousLotAnalyticsReport.totals.favorites_added),
      },
      {
        key: 'orders',
        title: 'Замовлення',
        current: lotAnalyticsReport.totals.orders_created,
        previous: previousLotAnalyticsReport.totals.orders_created,
        delta: buildDelta(lotAnalyticsReport.totals.orders_created, previousLotAnalyticsReport.totals.orders_created),
        deltaTone: buildDeltaTone(lotAnalyticsReport.totals.orders_created, previousLotAnalyticsReport.totals.orders_created),
      },
      {
        key: 'conversion',
        title: 'Конверсія',
        current: lotAnalyticsReport.totals.conversion_rate,
        previous: previousLotAnalyticsReport.totals.conversion_rate,
        delta: buildDelta(lotAnalyticsReport.totals.conversion_rate, previousLotAnalyticsReport.totals.conversion_rate),
        deltaTone: buildDeltaTone(lotAnalyticsReport.totals.conversion_rate, previousLotAnalyticsReport.totals.conversion_rate),
        format: 'percent' as const,
      },
    ];
  }, [lotAnalyticsReport, previousLotAnalyticsReport, previousPeriodFilters]);

  const activeTopSection = useMemo(() => {
    if (!lotAnalyticsReport) {
      return null;
    }

    if (topMetric === 'favorites_added') {
      return {
        title: 'Топ збережень',
        rows: lotAnalyticsReport.top_favorited,
        metricLabel: 'Збереження',
        metricKey: 'favorites_added' as const,
      };
    }

    if (topMetric === 'conversion_rate') {
      return {
        title: 'Топ конверсії',
        rows: lotAnalyticsReport.top_converting,
        metricLabel: 'Конверсія',
        metricKey: 'conversion_rate' as const,
      };
    }

    return {
      title: 'Топ переглядів',
      rows: lotAnalyticsReport.top_viewed,
      metricLabel: 'Перегляди',
      metricKey: 'views' as const,
    };
  }, [lotAnalyticsReport, topMetric]);

  const applyPnLFilters = () => {
    setPnlError(null);
    if (pnlFilters.startDate && pnlFilters.endDate && pnlFilters.startDate > pnlFilters.endDate) {
      setPnlError('Дата початку не може бути пізніше за дату завершення.');
      return;
    }

    setAppliedPnlFilters({
      start_date: pnlFilters.startDate || undefined,
      end_date: pnlFilters.endDate || undefined,
      warehouse_id: pnlFilters.warehouseId || undefined,
      channel: pnlFilters.channel || undefined,
    });
    setReportRequested(true);
  };

  const resetPnLFilters = () => {
    setPnlFilters(createInitialPnLState());
    setAppliedPnlFilters({});
    setReportRequested(false);
    setPnlError(null);
  };

  const applyLotAnalyticsFilters = () => {
    setLotAnalyticsError(null);

    if (
      lotAnalyticsFilters.start_date &&
      lotAnalyticsFilters.end_date &&
      lotAnalyticsFilters.start_date > lotAnalyticsFilters.end_date
    ) {
      setLotAnalyticsError('Дата початку не може бути пізніше за дату завершення.');
      return;
    }

    setAppliedLotAnalyticsFilters({
      start_date: lotAnalyticsFilters.start_date || undefined,
      end_date: lotAnalyticsFilters.end_date || undefined,
      warehouse_id: lotAnalyticsFilters.warehouse_id || undefined,
      lot_id: lotAnalyticsFilters.lot_id || undefined,
      type: lotAnalyticsFilters.type || undefined,
      brand: lotAnalyticsFilters.brand || undefined,
      model: lotAnalyticsFilters.model || undefined,
      condition: lotAnalyticsFilters.condition || undefined,
      source: lotAnalyticsFilters.source || undefined,
      group_by: lotAnalyticsFilters.group_by || 'DAY',
      top_limit: lotAnalyticsFilters.top_limit || 10,
    });
    setLotAnalyticsRequested(true);
  };

  const resetLotAnalyticsFilters = () => {
    const nextFilters = createInitialLotAnalyticsFilters();
    setLotAnalyticsFilters(nextFilters);
    setAppliedLotAnalyticsFilters(nextFilters);
    setLotAnalyticsRequested(true);
    setLotAnalyticsError(null);
  };

  const handleExportPnL = async () => {
    setPnlExportError(null);
    setPnlExportUrl(null);
    if (pnlFilters.startDate && pnlFilters.endDate && pnlFilters.startDate > pnlFilters.endDate) {
      setPnlExportError('Дата початку не може бути пізніше за дату завершення.');
      return;
    }

    try {
      const url = await exportPnlMutation.mutateAsync({
        start_date: pnlFilters.startDate || undefined,
        end_date: pnlFilters.endDate || undefined,
        warehouse_id: pnlFilters.warehouseId || undefined,
        channel: pnlFilters.channel || undefined,
      });
      setPnlExportUrl(url);
    } catch (error) {
      setPnlExportError(`Не вдалося експортувати P&L: ${extractApiErrorMessage(error)}`);
    }
  };

  const handleExportInventory = async () => {
    setInventoryExportError(null);
    setInventoryExportUrl(null);

    const payload: InventoryExportFilters = {
      search: inventoryFilters.search || undefined,
      brand: inventoryFilters.brand || undefined,
      model: inventoryFilters.model || undefined,
      status: inventoryFilters.status || undefined,
      type: inventoryFilters.type || undefined,
      condition: inventoryFilters.condition || undefined,
      season: inventoryFilters.season || undefined,
      warehouse_id: inventoryFilters.warehouseId || undefined,
      width: inventoryFilters.width ? Number.parseInt(inventoryFilters.width, 10) : undefined,
      profile: inventoryFilters.profile ? Number.parseInt(inventoryFilters.profile, 10) : undefined,
      diameter: inventoryFilters.diameter ? Number.parseInt(inventoryFilters.diameter, 10) : undefined,
      sell_price: inventoryFilters.sellPrice ? Number.parseFloat(inventoryFilters.sellPrice) : undefined,
      current_quantity: inventoryFilters.currentQuantity ? Number.parseInt(inventoryFilters.currentQuantity, 10) : undefined,
      is_run_flat: inventoryFilters.isRunFlat || undefined,
      is_spiked: inventoryFilters.isSpiked || undefined,
      anti_puncture: inventoryFilters.antiPuncture || undefined,
      page_size: 10000,
    };

    try {
      const url = await exportInventoryMutation.mutateAsync(payload);
      setInventoryExportUrl(url);
    } catch (error) {
      setInventoryExportError(`Не вдалося експортувати склад: ${extractApiErrorMessage(error)}`);
    }
  };

  const applyPresetRange = (days: 0 | 7 | 30 | 90) => {
    const today = new Date();
    const endDate = formatDateInput(today);
    const startDate = formatDateInput(new Date(today.getFullYear(), today.getMonth(), today.getDate() - days));

    setLotAnalyticsFilters((prev) => ({
      ...prev,
      start_date: startDate,
      end_date: endDate,
    }));
  };

  return (
    <section className="min-h-full space-y-4 bg-gray-950 p-4 text-white">
      <h2 className="text-lg font-semibold text-white">Адмін-звіти</h2>

      <article className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Операційний dashboard</h3>
            <p className="text-sm text-gray-400">Швидкий зріз по товарах, замовленнях і складах.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Товари</p>
            <p className="mt-2 text-2xl font-bold text-white">{dashboardStats.totalLots}</p>
          </div>
          <div className="rounded-2xl border border-amber-700/30 bg-amber-500/10 p-4">
            <p className="text-xs uppercase tracking-wide text-amber-200/80">Низький залишок</p>
            <p className="mt-2 text-2xl font-bold text-white">{dashboardStats.lowStockLots.length}</p>
          </div>
          <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">Активні склади</p>
            <p className="mt-2 text-2xl font-bold text-white">{dashboardStats.activeWarehouses}</p>
          </div>
          <div className="rounded-2xl border border-emerald-700/30 bg-emerald-500/10 p-4">
            <p className="text-xs uppercase tracking-wide text-emerald-200/80">Виторг по DONE</p>
            <p className="mt-2 text-2xl font-bold text-white">{formatNumber(dashboardStats.totalRevenue)} грн</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
            <h4 className="text-sm font-semibold text-white">Статуси замовлень</h4>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-xl border border-blue-700/30 bg-blue-500/10 p-3">
                <p className="text-xs uppercase tracking-wide text-blue-200/80">Нові</p>
                <p className="mt-2 text-xl font-bold text-white">{dashboardStats.newOrders}</p>
              </div>
              <div className="rounded-xl border border-amber-700/30 bg-amber-500/10 p-3">
                <p className="text-xs uppercase tracking-wide text-amber-200/80">Передплата</p>
                <p className="mt-2 text-xl font-bold text-white">{dashboardStats.inProgressOrders}</p>
              </div>
              <div className="rounded-xl border border-emerald-700/30 bg-emerald-500/10 p-3">
                <p className="text-xs uppercase tracking-wide text-emerald-200/80">Завершені</p>
                <p className="mt-2 text-xl font-bold text-white">{dashboardStats.doneOrders}</p>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-xl border border-amber-700/30 bg-amber-500/10 p-3">
                <p className="text-xs uppercase tracking-wide text-amber-200/80">Офлайн</p>
                <p className="mt-2 text-xl font-bold text-white">{dashboardStats.offlineOrders}</p>
              </div>
              <div className="rounded-xl border border-blue-700/30 bg-blue-500/10 p-3">
                <p className="text-xs uppercase tracking-wide text-blue-200/80">Онлайн</p>
                <p className="mt-2 text-xl font-bold text-white">{dashboardStats.onlineOrders}</p>
              </div>
            </div>
            <div className="mt-3 rounded-xl border border-gray-800 bg-gray-900 p-3 text-sm">
              <p className="text-xs uppercase tracking-wide text-gray-500">Частка офлайн-продажів</p>
              <p className="mt-2 text-xl font-bold text-white">
                {dashboardStats.doneOrders > 0 ? formatNumber((dashboardStats.doneOfflineOrders / (dashboardStats.doneOfflineOrders + dashboardStats.doneOnlineOrders || 1)) * 100) : '0'}%
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Від завершених продажів: {dashboardStats.doneOfflineOrders} офлайн / {dashboardStats.doneOnlineOrders} онлайн
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4">
            <h4 className="text-sm font-semibold text-white">Проблемні залишки</h4>
            <div className="mt-3 space-y-2">
              {dashboardStats.lowStockLots.length === 0 ? (
                <p className="text-sm text-gray-400">Усі товари мають достатній залишок.</p>
              ) : (
                dashboardStats.lowStockLots.slice(0, 5).map((lot) => (
                  <div key={lot.id} className="rounded-xl border border-gray-800 bg-gray-900 p-3">
                    <p className="text-sm font-semibold text-white">{lot.brand} {lot.model}</p>
                    <p className="mt-1 text-xs text-amber-200">Залишок: {lot.current_quantity} шт.</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </article>

      <article className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-white">Аналітика лотів</h3>
            <p className="text-sm text-gray-400">Перегляди, збереження в обране та конверсія в оформлення.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-6">
          <label className="space-y-1">
            <span className="text-sm text-gray-300">Дата початку</span>
            <input
              type="date"
              value={lotAnalyticsFilters.start_date ?? ''}
              onChange={(event) => setLotAnalyticsFilters((prev) => ({ ...prev, start_date: event.target.value || undefined }))}
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-gray-300">Дата завершення</span>
            <input
              type="date"
              value={lotAnalyticsFilters.end_date ?? ''}
              onChange={(event) => setLotAnalyticsFilters((prev) => ({ ...prev, end_date: event.target.value || undefined }))}
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-gray-300">Склад</span>
            <select
              value={lotAnalyticsFilters.warehouse_id ?? ''}
              onChange={(event) => setLotAnalyticsFilters((prev) => ({ ...prev, warehouse_id: event.target.value || undefined }))}
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
            >
              <option value="">Усі склади</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} ({warehouse.location})
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm text-gray-300">Тип товару</span>
            <select
              value={lotAnalyticsFilters.type ?? ''}
              onChange={(event) =>
                setLotAnalyticsFilters((prev) => ({
                  ...prev,
                  type: (event.target.value || undefined) as LotAnalyticsReportFilters['type'],
                }))
              }
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
            >
              <option value="">Усі типи</option>
              <option value="TIRE">Шини</option>
              <option value="RIM">Диски</option>
              <option value="ACCESSORY">Супутні товари</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm text-gray-300">Бренд</span>
            <input
              type="text"
              value={lotAnalyticsFilters.brand ?? ''}
              onChange={(event) => setLotAnalyticsFilters((prev) => ({ ...prev, brand: event.target.value || undefined }))}
              placeholder="Michelin, Hankook..."
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-gray-300">Модель</span>
            <input
              type="text"
              value={lotAnalyticsFilters.model ?? ''}
              onChange={(event) => setLotAnalyticsFilters((prev) => ({ ...prev, model: event.target.value || undefined }))}
              placeholder="Pilot Sport 4, Enasave..."
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-gray-300">Стан</span>
            <select
              value={lotAnalyticsFilters.condition ?? ''}
              onChange={(event) =>
                setLotAnalyticsFilters((prev) => ({
                  ...prev,
                  condition: (event.target.value || undefined) as LotAnalyticsReportFilters['condition'],
                }))
              }
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
            >
              <option value="">Будь-який стан</option>
              <option value="NEW">Нові</option>
              <option value="USED">Вживані</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm text-gray-300">Джерело</span>
            <select
              value={lotAnalyticsFilters.source ?? ''}
              onChange={(event) =>
                setLotAnalyticsFilters((prev) => ({
                  ...prev,
                  source: (event.target.value || undefined) as LotAnalyticsReportFilters['source'],
                }))
              }
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
            >
              <option value="">Усі джерела</option>
              <option value="WEB">WEB</option>
              <option value="TMA">TMA</option>
              <option value="STAFF">STAFF</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm text-gray-300">Групування</span>
            <select
              value={lotAnalyticsFilters.group_by ?? 'DAY'}
              onChange={(event) =>
                setLotAnalyticsFilters((prev) => ({
                  ...prev,
                  group_by: (event.target.value || 'DAY') as LotAnalyticsReportFilters['group_by'],
                }))
              }
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
            >
              <option value="DAY">По днях</option>
              <option value="WEEK">По тижнях</option>
              <option value="MONTH">По місяцях</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm text-gray-300">Top limit</span>
            <select
              value={lotAnalyticsFilters.top_limit ?? 10}
              onChange={(event) =>
                setLotAnalyticsFilters((prev) => ({
                  ...prev,
                  top_limit: Number(event.target.value) as LotAnalyticsReportFilters['top_limit'],
                }))
              }
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
          <label className="space-y-1 xl:col-span-2">
            <span className="text-sm text-gray-300">Конкретний лот</span>
            <select
              value={lotAnalyticsFilters.lot_id ?? ''}
              onChange={(event) => setLotAnalyticsFilters((prev) => ({ ...prev, lot_id: event.target.value || undefined }))}
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
            >
              <option value="">Усі лоти</option>
              {analyticsLots
                .filter((lot) => !lotAnalyticsFilters.type || lot.type === lotAnalyticsFilters.type)
                .map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {[lot.brand, lot.model].filter(Boolean).join(' · ') || lot.id}
                  </option>
                ))}
            </select>
          </label>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={applyLotAnalyticsFilters}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Застосувати фільтр
          </button>
          <button
            type="button"
            onClick={resetLotAnalyticsFilters}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-200 transition hover:bg-gray-700"
          >
            Скинути
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { label: 'Сьогодні', days: 0 as const },
            { label: '7 днів', days: 7 as const },
            { label: '30 днів', days: 30 as const },
            { label: '90 днів', days: 90 as const },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPresetRange(preset.days)}
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-200 transition hover:bg-gray-700"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {lotAnalyticsError ? (
          <div className="mt-3 rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">{lotAnalyticsError}</div>
        ) : null}

        {isLotAnalyticsLoading ? (
          <div className="mt-3 rounded-xl border border-gray-800 bg-gray-950 p-4 text-sm text-gray-400">Завантаження аналітики...</div>
        ) : null}

        {isLotAnalyticsRequestError ? (
          <div className="mt-3 rounded-xl border border-red-800/60 bg-red-950/30 p-4 text-sm text-red-300">
            Не вдалося отримати аналітику: {extractApiErrorMessage(lotAnalyticsRequestError)}
          </div>
        ) : null}

        {!isLotAnalyticsLoading && !isLotAnalyticsRequestError && lotAnalyticsReport ? (
          <div className="mt-3 space-y-4">
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Перегляди</p>
                <p className="mt-2 text-2xl font-bold text-white">{formatNumber(lotAnalyticsReport.totals.views)}</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Збереження</p>
                <p className="mt-2 text-2xl font-bold text-white">{formatNumber(lotAnalyticsReport.totals.favorites_added)}</p>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
                <p className="text-xs uppercase tracking-wide text-gray-500">Замовлення</p>
                <p className="mt-2 text-2xl font-bold text-white">{formatNumber(lotAnalyticsReport.totals.orders_created)}</p>
              </div>
              <div className="rounded-xl border border-emerald-700/30 bg-emerald-500/10 p-3">
                <p className="text-xs uppercase tracking-wide text-emerald-200/80">Конверсія</p>
                <p className="mt-2 text-2xl font-bold text-white">{formatPercent(lotAnalyticsReport.totals.conversion_rate)}</p>
              </div>
            </div>

            {previousPeriodFilters ? (
              <div className="rounded-xl border border-violet-700/30 bg-violet-500/10 p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-wide text-violet-200/80">Поточний період vs попередній</p>
                  <p className="text-[11px] text-violet-100/70">
                    {previousPeriodFilters.start_date} - {previousPeriodFilters.end_date}
                  </p>
                </div>
                {isPreviousLotAnalyticsLoading ? (
                  <p className="text-sm text-gray-300">Завантаження порівняння...</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    {comparisonCards.map((card) => (
                      <div key={card.key} className="rounded-xl border border-violet-700/20 bg-gray-950/50 p-3">
                        <p className="text-xs uppercase tracking-wide text-violet-100/70">{card.title}</p>
                        <p className="mt-2 text-xl font-bold text-white">
                          {'format' in card && card.format === 'percent' ? formatPercent(card.current) : formatNumber(card.current)}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          Було:{' '}
                          {'format' in card && card.format === 'percent' ? formatPercent(card.previous) : formatNumber(card.previous)}
                        </p>
                      <p className={`mt-1 text-xs font-semibold ${card.deltaTone}`}>{card.delta}</p>
                    </div>
                  ))}
                </div>
                )}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
              {sourceBreakdownCards.map((card) => (
                <div key={card.key} className={`rounded-xl border p-3 ${card.accentClass}`}>
                  <p className={`text-xs uppercase tracking-wide ${card.labelClass}`}>{card.title}</p>
                  {((card.key === 'WEB' && isWebAnalyticsLoading) ||
                    (card.key === 'TMA' && isTmaAnalyticsLoading) ||
                    (card.key === 'STAFF' && isStaffAnalyticsLoading)) ? (
                    <p className="mt-2 text-sm text-gray-300">Завантаження...</p>
                  ) : (
                    <>
                      <div className="mt-3 grid grid-cols-1 gap-2">
                        {[
                          {
                            key: 'views',
                            title: 'Перегляди',
                            value: buildSourceMetricComparison(
                              card.report?.totals.views ?? 0,
                              card.previousReport?.totals.views ?? 0
                            ),
                          },
                          {
                            key: 'favorites',
                            title: 'Збереження',
                            value: buildSourceMetricComparison(
                              card.report?.totals.favorites_added ?? 0,
                              card.previousReport?.totals.favorites_added ?? 0
                            ),
                          },
                          {
                            key: 'orders',
                            title: 'Замовлення',
                            value: buildSourceMetricComparison(
                              card.report?.totals.orders_created ?? 0,
                              card.previousReport?.totals.orders_created ?? 0
                            ),
                          },
                        ].map((metric) => (
                          <div key={`${card.key}-${metric.key}`} className="rounded-lg border border-gray-800/60 bg-gray-950/50 p-2">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-[11px] uppercase tracking-wide text-gray-400">{metric.title}</p>
                                <p className="mt-1 text-lg font-bold text-white">{formatNumber(metric.value.current)}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[11px] text-gray-500">Було {formatNumber(metric.value.previous)}</p>
                                <p className={`mt-1 text-xs font-semibold ${metric.value.deltaTone}`}>{metric.value.delta}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-xs font-semibold text-white">
                        Конверсія: {formatPercent(card.report?.totals.conversion_rate ?? 0)}
                        {card.previousReport ? (
                          <span
                            className={`ml-2 ${
                              buildDeltaTone(
                                card.report?.totals.conversion_rate ?? 0,
                                card.previousReport.totals.conversion_rate
                              )
                            }`}
                          >
                            {buildDeltaValue(
                              card.report?.totals.conversion_rate ?? 0,
                              card.previousReport.totals.conversion_rate
                            )}
                          </span>
                        ) : null}
                      </p>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-wider text-gray-400">Динаміка по {lotAnalyticsPeriodLabel}</p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                    Перегляди
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    Збереження
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    Замовлення
                  </span>
                </div>
              </div>
              {stackedLotAnalyticsDailyRows.length === 0 ? (
                <p className="text-sm text-gray-400">Немає подій за вибраний період.</p>
              ) : (
                <div className="space-y-2.5">
                  {stackedLotAnalyticsDailyRows.map((point) => (
                    <div key={point.date} className="grid grid-cols-[92px_1fr] items-center gap-3">
                      <div className="text-xs text-gray-400">{point.date}</div>
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2">
                            <div className="h-1.5 overflow-hidden rounded-full bg-gray-900">
                              <div
                                className="h-full rounded-full border border-violet-300/80 bg-violet-400/20"
                                style={{ width: point.previousTotalWidth }}
                              />
                            </div>
                          </div>
                          <div className="relative h-3 overflow-hidden rounded-full bg-gray-800">
                            <div className="flex h-full overflow-hidden rounded-full" style={{ width: point.totalWidth }}>
                              <div className="h-full bg-blue-500" style={{ width: point.stackedViewWidth }} />
                              <div className="h-full bg-amber-500" style={{ width: point.stackedFavoriteWidth }} />
                              <div className="h-full bg-emerald-500" style={{ width: point.stackedOrderWidth }} />
                            </div>
                          </div>
                        </div>
                        <div className="grid min-w-[108px] grid-cols-3 gap-2 text-right text-xs text-white">
                          <span>{point.views}</span>
                          <span>{point.favorites_added}</span>
                          <span>{point.orders_created}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {previousPeriodFilters ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-gray-800 pt-3 text-[11px] text-gray-400">
                  <div className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-gray-700" />
                    Поточний період
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <span className="h-1.5 w-6 rounded-full border border-violet-300/80 bg-violet-400/20" />
                    Попередній період overlay
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-wider text-gray-400">Конверсія по {lotAnalyticsPeriodLabel}</p>
                <p className="text-[11px] text-gray-500">Замовлення / перегляди</p>
              </div>
              {preparedConversionRows.length === 0 ? (
                <p className="text-sm text-gray-400">Немає подій за вибраний період.</p>
              ) : (
                <div className="space-y-2.5">
                  {preparedConversionRows.map((point) => (
                    <div key={`conversion-${point.date}`} className="grid grid-cols-[92px_1fr] items-center gap-3">
                      <div className="text-xs text-gray-400">{point.date}</div>
                      <div className="flex items-center gap-3">
                        <div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-800">
                          <div className="h-full rounded-full bg-fuchsia-500" style={{ width: point.conversionWidth }} />
                        </div>
                        <span className="min-w-[56px] text-right text-xs font-semibold text-white">
                          {formatPercent(point.conversionRate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {lotAnalyticsFilters.lot_id ? (
              <div className="rounded-xl border border-blue-700/30 bg-blue-950/20 p-3">
                <p className="mb-2 text-xs uppercase tracking-wider text-blue-200/80">Drill-down по вибраному лоту</p>
                <p className="text-sm font-semibold text-white">
                  {(() => {
                    const selectedInventoryLot = analyticsLots.find((lot) => lot.id === lotAnalyticsFilters.lot_id);
                    if (selectedInventoryLot) {
                      return [selectedInventoryLot.brand, selectedInventoryLot.model].filter(Boolean).join(' · ') || selectedInventoryLot.id;
                    }

                    const selectedAnalyticsLot = lotAnalyticsReport.top_viewed.find((row) => row.lot_id === lotAnalyticsFilters.lot_id);
                    if (selectedAnalyticsLot) {
                      return [selectedAnalyticsLot.brand, selectedAnalyticsLot.model].filter(Boolean).join(' · ') || selectedAnalyticsLot.lot_id;
                    }

                    return lotAnalyticsFilters.lot_id;
                  })()}
                </p>
                <p className="mt-1 text-xs text-blue-100/70">
                  Окрема часова серія нижче вже показує лише цей лот, без домішування інших позицій.
                </p>
              </div>
            ) : null}

            {activeTopSection ? (
              <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-wider text-gray-400">{activeTopSection.title}</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'views', label: 'Перегляди' },
                      { key: 'favorites_added', label: 'Збереження' },
                      { key: 'conversion_rate', label: 'Конверсія' },
                    ].map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setTopMetric(option.key as typeof topMetric)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          topMetric === option.key
                            ? 'border-blue-700/60 bg-blue-900/40 text-blue-100'
                            : 'border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {activeTopSection.rows.length === 0 ? (
                    <p className="text-sm text-gray-400">Немає даних.</p>
                  ) : (
                    activeTopSection.rows.map((row) => (
                      <div key={`${activeTopSection.title}-${row.lot_id}`} className="rounded-lg border border-gray-800 bg-gray-900 p-2">
                        <p className="text-sm font-semibold text-white">{buildLotLabel(row)}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {row.type} • {row.condition} • перегляди {row.views} • збереження {row.favorites_added} • замовлення {row.orders_created}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-emerald-300">
                          {activeTopSection.metricKey === 'conversion_rate'
                            ? `${activeTopSection.metricLabel}: ${formatPercent(row.conversion_rate)}`
                            : `${activeTopSection.metricLabel}: ${formatNumber(row[activeTopSection.metricKey])}`}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </article>

      <article className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">P&L звіт (JSON)</h3>
          <button
            type="button"
            onClick={handleExportPnL}
            disabled={exportPnlMutation.isPending}
            className="rounded-lg border border-blue-700/60 bg-blue-900/30 px-3 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-900/45 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exportPnlMutation.isPending ? 'Експорт...' : 'Експорт P&L у Sheets'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
          <label className="space-y-1">
            <span className="text-sm text-gray-300">Дата початку</span>
            <input
              type="date"
              value={pnlFilters.startDate}
              onChange={(event) => setPnlFilters((prev) => ({ ...prev, startDate: event.target.value }))}
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-gray-300">Дата завершення</span>
            <input
              type="date"
              value={pnlFilters.endDate}
              onChange={(event) => setPnlFilters((prev) => ({ ...prev, endDate: event.target.value }))}
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-gray-300">Склад</span>
            <select
              value={pnlFilters.warehouseId}
              onChange={(event) => setPnlFilters((prev) => ({ ...prev, warehouseId: event.target.value }))}
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
            >
              <option value="">Усі склади</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} ({warehouse.location})
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm text-gray-300">Канал</span>
            <select
              value={pnlFilters.channel}
              onChange={(event) => setPnlFilters((prev) => ({ ...prev, channel: event.target.value as '' | 'ONLINE' | 'OFFLINE' }))}
              className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
            >
              <option value="">Усі канали</option>
              <option value="ONLINE">Онлайн</option>
              <option value="OFFLINE">Офлайн</option>
            </select>
          </label>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={applyPnLFilters}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Застосувати фільтр
          </button>
          <button
            type="button"
            onClick={resetPnLFilters}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-200 transition hover:bg-gray-700"
          >
            Скинути
          </button>
        </div>

        {pnlError ? (
          <div className="mt-3 rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">{pnlError}</div>
        ) : null}

        {pnlExportError ? (
          <div className="mt-3 rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">{pnlExportError}</div>
        ) : null}

        {pnlExportUrl ? (
          <a href={pnlExportUrl} target="_blank" rel="noreferrer" className="mt-3 block break-all text-sm text-blue-300 hover:text-blue-200">
            {pnlExportUrl}
          </a>
        ) : null}

        {isPnLLoading ? (
          <div className="mt-3 rounded-xl border border-gray-800 bg-gray-950 p-4 text-sm text-gray-400">Завантаження звіту...</div>
        ) : null}

        {isPnLError ? (
          <div className="mt-3 rounded-xl border border-red-800/60 bg-red-950/30 p-4 text-sm text-red-300">
            Не вдалося отримати P&L: {extractApiErrorMessage(pnlRequestError)}
          </div>
        ) : null}

        {!isPnLLoading && !isPnLError && pnlReport ? (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div className="rounded-lg border border-gray-800 bg-gray-950 p-2">
                <p className="text-xs text-gray-500">Дохід</p>
                <p className="font-semibold text-white">{formatNumber(pnlReport.total_revenue)}</p>
              </div>
              <div className="rounded-lg border border-gray-800 bg-gray-950 p-2">
                <p className="text-xs text-gray-500">Собівартість</p>
                <p className="font-semibold text-white">{formatNumber(pnlReport.total_cogs)}</p>
              </div>
              <div className="rounded-lg border border-gray-800 bg-gray-950 p-2">
                <p className="text-xs text-gray-500">Прибуток</p>
                <p className="font-semibold text-white">{formatNumber(pnlReport.total_profit)}</p>
              </div>
              <div className="rounded-lg border border-gray-800 bg-gray-950 p-2">
                <p className="text-xs text-gray-500">Продано шт.</p>
                <p className="font-semibold text-white">{formatNumber(pnlReport.total_items_sold)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-xl border border-amber-700/30 bg-amber-500/10 p-3">
                <p className="text-xs uppercase tracking-wide text-amber-200/80">Офлайн виторг</p>
                <p className="mt-2 text-xl font-bold text-white">{formatNumber(offlinePnL?.revenue ?? 0)}</p>
                <p className="mt-1 text-xs text-amber-100/70">
                  Прибуток: {formatNumber(offlinePnL?.profit ?? 0)} • Продано: {formatNumber(offlinePnL?.items_sold ?? 0)}
                </p>
              </div>
              <div className="rounded-xl border border-blue-700/30 bg-blue-500/10 p-3">
                <p className="text-xs uppercase tracking-wide text-blue-200/80">Онлайн виторг</p>
                <p className="mt-2 text-xl font-bold text-white">{formatNumber(onlinePnL?.revenue ?? 0)}</p>
                <p className="mt-1 text-xs text-blue-100/70">
                  Прибуток: {formatNumber(onlinePnL?.profit ?? 0)} • Продано: {formatNumber(onlinePnL?.items_sold ?? 0)}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
              <p className="mb-2 text-xs uppercase tracking-wider text-gray-400">По складах</p>
              <div className="space-y-2">
                {pnlReport.by_warehouse.map((row) => (
                  <div key={row.warehouse_name} className="rounded-lg border border-gray-800 bg-gray-900 p-2 text-sm">
                    <p className="font-semibold text-white">{row.warehouse_name}</p>
                    <p className="text-gray-300">
                      Дохід {formatNumber(row.revenue)} • Собівартість {formatNumber(row.cogs)} • Прибуток {formatNumber(row.profit)}
                    </p>
                    <p className="text-xs text-gray-500">Продано: {row.items_sold}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </article>

      <article className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">Експорт складу у Sheets</h3>
          <button
            type="button"
            onClick={handleExportInventory}
            disabled={exportInventoryMutation.isPending}
            className="rounded-lg border border-blue-700/60 bg-blue-900/30 px-3 py-2 text-sm font-semibold text-blue-200 transition hover:bg-blue-900/45 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {exportInventoryMutation.isPending ? 'Експорт...' : 'Експорт складу'}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input
            type="text"
            value={inventoryFilters.search}
            onChange={(event) => setInventoryFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="Пошук"
            className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
          />
          <input
            type="text"
            value={inventoryFilters.brand}
            onChange={(event) => setInventoryFilters((prev) => ({ ...prev, brand: event.target.value }))}
            placeholder="Бренд"
            className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
          />
          <input
            type="text"
            value={inventoryFilters.model}
            onChange={(event) => setInventoryFilters((prev) => ({ ...prev, model: event.target.value }))}
            placeholder="Модель"
            className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
          />
          <select
            value={inventoryFilters.status}
            onChange={(event) => setInventoryFilters((prev) => ({ ...prev, status: event.target.value }))}
            className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
          >
            <option value="">Статус лота</option>
            <option value="ACTIVE">Активний</option>
            <option value="IN_STOCK">На складі</option>
            <option value="RESERVED">Резерв</option>
            <option value="SOLD">Продано</option>
            <option value="ARCHIVED">Архів</option>
          </select>
          <select
            value={inventoryFilters.type}
            onChange={(event) => setInventoryFilters((prev) => ({ ...prev, type: event.target.value }))}
            className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
          >
            <option value="">Тип</option>
            <option value="TIRE">Шина</option>
            <option value="RIM">Диск</option>
          </select>
          <select
            value={inventoryFilters.condition}
            onChange={(event) => setInventoryFilters((prev) => ({ ...prev, condition: event.target.value }))}
            className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
          >
            <option value="">Стан</option>
            <option value="NEW">Новий</option>
            <option value="USED">Вживаний</option>
          </select>
          <select
            value={inventoryFilters.season}
            onChange={(event) => setInventoryFilters((prev) => ({ ...prev, season: event.target.value }))}
            className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
          >
            <option value="">Сезон</option>
            <option value="SUMMER">Літній</option>
            <option value="WINTER">Зимовий</option>
            <option value="ALL_SEASON">Всесезонний</option>
          </select>
          <select
            value={inventoryFilters.warehouseId}
            onChange={(event) => setInventoryFilters((prev) => ({ ...prev, warehouseId: event.target.value }))}
            className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
          >
            <option value="">Склад</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={inventoryFilters.width}
            onChange={(event) => setInventoryFilters((prev) => ({ ...prev, width: event.target.value }))}
            placeholder="Ширина"
            className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
          />
          <input
            type="number"
            value={inventoryFilters.profile}
            onChange={(event) => setInventoryFilters((prev) => ({ ...prev, profile: event.target.value }))}
            placeholder="Профіль"
            className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
          />
          <input
            type="number"
            value={inventoryFilters.diameter}
            onChange={(event) => setInventoryFilters((prev) => ({ ...prev, diameter: event.target.value }))}
            placeholder="Діаметр"
            className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
          />
          <input
            type="number"
            value={inventoryFilters.sellPrice}
            onChange={(event) => setInventoryFilters((prev) => ({ ...prev, sellPrice: event.target.value }))}
            placeholder="Ціна продажу"
            className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
          />
          <input
            type="number"
            value={inventoryFilters.currentQuantity}
            onChange={(event) => setInventoryFilters((prev) => ({ ...prev, currentQuantity: event.target.value }))}
            placeholder="Кількість"
            className="rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
          />
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <label className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-200">
            <input
              type="checkbox"
              checked={inventoryFilters.isRunFlat}
              onChange={(event) => setInventoryFilters((prev) => ({ ...prev, isRunFlat: event.target.checked }))}
            />
            Run Flat
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-200">
            <input
              type="checkbox"
              checked={inventoryFilters.isSpiked}
              onChange={(event) => setInventoryFilters((prev) => ({ ...prev, isSpiked: event.target.checked }))}
            />
            Шиповані
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-200">
            <input
              type="checkbox"
              checked={inventoryFilters.antiPuncture}
              onChange={(event) => setInventoryFilters((prev) => ({ ...prev, antiPuncture: event.target.checked }))}
            />
            Антипрокол
          </label>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setInventoryFilters(createInitialInventoryExportState())}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-200 transition hover:bg-gray-700"
          >
            Скинути фільтри
          </button>
        </div>

        {inventoryExportError ? (
          <div className="mt-3 rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">{inventoryExportError}</div>
        ) : null}

        {inventoryExportUrl ? (
          <a
            href={inventoryExportUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block break-all text-sm text-blue-300 hover:text-blue-200"
          >
            {inventoryExportUrl}
          </a>
        ) : null}
      </article>
    </section>
  );
}
