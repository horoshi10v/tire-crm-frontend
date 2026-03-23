import { useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { useAdminPnLReport, useExportInventory, useExportPnL } from '../api/adminReports';
import { useStaffLots } from '../api/staffLots';
import { useStaffOrders } from '../api/staffOrders';
import { useStaffWarehouses } from '../api/staffWarehouses';
import type { InventoryExportFilters, PnLReportFilters } from '../types/adminReports';

type PnLFiltersState = {
  startDate: string;
  endDate: string;
  warehouseId: string;
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
});

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
  const [pnlFilters, setPnlFilters] = useState<PnLFiltersState>(createInitialPnLState());
  const [appliedPnlFilters, setAppliedPnlFilters] = useState<PnLReportFilters>({});
  const [reportRequested, setReportRequested] = useState(false);

  const [inventoryFilters, setInventoryFilters] = useState<InventoryExportFormState>(createInitialInventoryExportState());

  const [pnlError, setPnlError] = useState<string | null>(null);
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
  const exportPnlMutation = useExportPnL();
  const exportInventoryMutation = useExportInventory();

  const dashboardStats = useMemo(() => {
    const lowStockLots = lots.filter((lot) => lot.current_quantity <= 4);
    const activeWarehouses = warehouses.filter((warehouse) => warehouse.is_active).length;
    const newOrders = orders.filter((order) => order.status === 'NEW').length;
    const inProgressOrders = orders.filter((order) => order.status === 'PREPAYMENT').length;
    const doneOrders = orders.filter((order) => order.status === 'DONE').length;
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
      totalRevenue,
    };
  }, [lots, orders, warehouses]);

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
    });
    setReportRequested(true);
  };

  const resetPnLFilters = () => {
    setPnlFilters(createInitialPnLState());
    setAppliedPnlFilters({});
    setReportRequested(false);
    setPnlError(null);
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

  return (
    <section className="space-y-4 p-4 text-white">
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

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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
