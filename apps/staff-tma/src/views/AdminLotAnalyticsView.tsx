import { useMemo, useState } from 'react';
import { useAdminLotAnalyticsReport } from '../api/adminReports';
import { useStaffLots } from '../api/staffLots';
import { useStaffWarehouses } from '../api/staffWarehouses';
import type { LotAnalyticsReportFilters } from '../types/adminReports';
import AnalyticsLineChart from '../components/AnalyticsLineChart';
import MetricComparisonCard from '../components/MetricComparisonCard';
import { useAdminLotAnalyticsPresentation } from '../hooks/useAdminLotAnalyticsPresentation';
import {
  buildDeltaTone,
  buildDeltaValue,
  buildLotLabel,
  buildSourceMetricComparison,
  calculatePreviousPeriodFilters,
  createInitialLotAnalyticsFilters,
  extractApiErrorMessage,
  formatDateInput,
  formatNumber,
  formatPercent,
  sortAnalyticsLots,
} from '../utils/adminLotAnalytics';

export default function AdminLotAnalyticsView() {
  const [topMetric, setTopMetric] = useState<'views' | 'favorites_added' | 'conversion_rate'>('views');
  const [lotAnalyticsFilters, setLotAnalyticsFilters] = useState<LotAnalyticsReportFilters>(createInitialLotAnalyticsFilters());
  const [appliedLotAnalyticsFilters, setAppliedLotAnalyticsFilters] = useState<LotAnalyticsReportFilters>({});
  const [lotAnalyticsRequested, setLotAnalyticsRequested] = useState(true);
  const [lotAnalyticsError, setLotAnalyticsError] = useState<string | null>(null);

  const { data: warehouses = [] } = useStaffWarehouses();
  const { data: lots = [] } = useStaffLots({ page: 1, pageSize: 500 });

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

  const { data: previousLotAnalyticsReport, isLoading: isPreviousLotAnalyticsLoading } = useAdminLotAnalyticsReport(
    previousPeriodFilters ?? {},
    lotAnalyticsRequested && Boolean(previousPeriodFilters)
  );

  const { data: webAnalyticsReport, isLoading: isWebAnalyticsLoading } = useAdminLotAnalyticsReport(
    { ...appliedLotAnalyticsFilters, source: 'WEB' },
    lotAnalyticsRequested
  );
  const { data: tmaAnalyticsReport, isLoading: isTmaAnalyticsLoading } = useAdminLotAnalyticsReport(
    { ...appliedLotAnalyticsFilters, source: 'TMA' },
    lotAnalyticsRequested
  );
  const { data: staffAnalyticsReport, isLoading: isStaffAnalyticsLoading } = useAdminLotAnalyticsReport(
    { ...appliedLotAnalyticsFilters, source: 'STAFF' },
    lotAnalyticsRequested
  );

  const { data: previousWebAnalyticsReport } = useAdminLotAnalyticsReport(
    previousPeriodFilters ? { ...previousPeriodFilters, source: 'WEB' } : {},
    lotAnalyticsRequested && Boolean(previousPeriodFilters)
  );
  const { data: previousTmaAnalyticsReport } = useAdminLotAnalyticsReport(
    previousPeriodFilters ? { ...previousPeriodFilters, source: 'TMA' } : {},
    lotAnalyticsRequested && Boolean(previousPeriodFilters)
  );
  const { data: previousStaffAnalyticsReport } = useAdminLotAnalyticsReport(
    previousPeriodFilters ? { ...previousPeriodFilters, source: 'STAFF' } : {},
    lotAnalyticsRequested && Boolean(previousPeriodFilters)
  );

  const analyticsLots = useMemo(() => sortAnalyticsLots(lots), [lots]);

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

  const {
    preparedDailyRows,
    stackedDailyRows,
    preparedConversionRows,
    periodLabel: lotAnalyticsPeriodLabel,
    comparisonCards,
    activeTopSection,
  } = useAdminLotAnalyticsPresentation({
    report: lotAnalyticsReport,
    previousReport: previousLotAnalyticsReport,
    previousPeriodFilters,
    topMetric,
  });

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
      <h2 className="text-lg font-semibold text-white">Статистика</h2>

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
            <input type="date" value={lotAnalyticsFilters.start_date ?? ''} onChange={(event) => setLotAnalyticsFilters((prev) => ({ ...prev, start_date: event.target.value || undefined }))} className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500" />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-gray-300">Дата завершення</span>
            <input type="date" value={lotAnalyticsFilters.end_date ?? ''} onChange={(event) => setLotAnalyticsFilters((prev) => ({ ...prev, end_date: event.target.value || undefined }))} className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500" />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-gray-300">Склад</span>
            <select value={lotAnalyticsFilters.warehouse_id ?? ''} onChange={(event) => setLotAnalyticsFilters((prev) => ({ ...prev, warehouse_id: event.target.value || undefined }))} className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500">
              <option value="">Усі склади</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>{warehouse.name} ({warehouse.location})</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm text-gray-300">Тип товару</span>
            <select value={lotAnalyticsFilters.type ?? ''} onChange={(event) => setLotAnalyticsFilters((prev) => ({ ...prev, type: (event.target.value || undefined) as LotAnalyticsReportFilters['type'] }))} className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500">
              <option value="">Усі типи</option>
              <option value="TIRE">Шини</option>
              <option value="RIM">Диски</option>
              <option value="ACCESSORY">Супутні товари</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm text-gray-300">Бренд</span>
            <input type="text" value={lotAnalyticsFilters.brand ?? ''} onChange={(event) => setLotAnalyticsFilters((prev) => ({ ...prev, brand: event.target.value || undefined }))} placeholder="Michelin, Hankook..." className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500" />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-gray-300">Модель</span>
            <input type="text" value={lotAnalyticsFilters.model ?? ''} onChange={(event) => setLotAnalyticsFilters((prev) => ({ ...prev, model: event.target.value || undefined }))} placeholder="Pilot Sport 4, Enasave..." className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500" />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-gray-300">Стан</span>
            <select value={lotAnalyticsFilters.condition ?? ''} onChange={(event) => setLotAnalyticsFilters((prev) => ({ ...prev, condition: (event.target.value || undefined) as LotAnalyticsReportFilters['condition'] }))} className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500">
              <option value="">Будь-який стан</option>
              <option value="NEW">Нові</option>
              <option value="USED">Вживані</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm text-gray-300">Джерело</span>
            <select value={lotAnalyticsFilters.source ?? ''} onChange={(event) => setLotAnalyticsFilters((prev) => ({ ...prev, source: (event.target.value || undefined) as LotAnalyticsReportFilters['source'] }))} className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500">
              <option value="">Усі джерела</option>
              <option value="WEB">WEB</option>
              <option value="TMA">TMA</option>
              <option value="STAFF">STAFF</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm text-gray-300">Групування</span>
            <select value={lotAnalyticsFilters.group_by ?? 'DAY'} onChange={(event) => setLotAnalyticsFilters((prev) => ({ ...prev, group_by: (event.target.value || 'DAY') as LotAnalyticsReportFilters['group_by'] }))} className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500">
              <option value="DAY">По днях</option>
              <option value="WEEK">По тижнях</option>
              <option value="MONTH">По місяцях</option>
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-sm text-gray-300">Top limit</span>
            <select value={lotAnalyticsFilters.top_limit ?? 10} onChange={(event) => setLotAnalyticsFilters((prev) => ({ ...prev, top_limit: Number(event.target.value) as LotAnalyticsReportFilters['top_limit'] }))} className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
          <label className="space-y-1 xl:col-span-2">
            <span className="text-sm text-gray-300">Конкретний лот</span>
            <select value={lotAnalyticsFilters.lot_id ?? ''} onChange={(event) => setLotAnalyticsFilters((prev) => ({ ...prev, lot_id: event.target.value || undefined }))} className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500">
              <option value="">Усі лоти</option>
              {analyticsLots.filter((lot) => !lotAnalyticsFilters.type || lot.type === lotAnalyticsFilters.type).map((lot) => (
                <option key={lot.id} value={lot.id}>{[lot.brand, lot.model].filter(Boolean).join(' · ') || lot.id}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="mt-3 flex gap-2">
          <button type="button" onClick={applyLotAnalyticsFilters} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500">Застосувати фільтр</button>
          <button type="button" onClick={resetLotAnalyticsFilters} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-200 transition hover:bg-gray-700">Скинути</button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {[{ label: 'Сьогодні', days: 0 as const }, { label: '7 днів', days: 7 as const }, { label: '30 днів', days: 30 as const }, { label: '90 днів', days: 90 as const }].map((preset) => (
            <button key={preset.label} type="button" onClick={() => applyPresetRange(preset.days)} className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-200 transition hover:bg-gray-700">{preset.label}</button>
          ))}
        </div>

        {lotAnalyticsError ? <div className="mt-3 rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">{lotAnalyticsError}</div> : null}
        {isLotAnalyticsLoading ? <div className="mt-3 rounded-xl border border-gray-800 bg-gray-950 p-4 text-sm text-gray-400">Завантаження аналітики...</div> : null}
        {isLotAnalyticsRequestError ? <div className="mt-3 rounded-xl border border-red-800/60 bg-red-950/30 p-4 text-sm text-red-300">Не вдалося отримати аналітику: {extractApiErrorMessage(lotAnalyticsRequestError)}</div> : null}

        {!isLotAnalyticsLoading && !isLotAnalyticsRequestError && lotAnalyticsReport ? (
          <div className="mt-3 space-y-4">
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <MetricComparisonCard title="Перегляди" current={formatNumber(lotAnalyticsReport.totals.views)} />
              <MetricComparisonCard title="Збереження" current={formatNumber(lotAnalyticsReport.totals.favorites_added)} />
              <MetricComparisonCard title="Замовлення" current={formatNumber(lotAnalyticsReport.totals.orders_created)} />
              <MetricComparisonCard
                title="Конверсія"
                current={formatPercent(lotAnalyticsReport.totals.conversion_rate)}
                className="rounded-xl border border-emerald-700/30 bg-emerald-500/10 p-3"
                titleClassName="text-xs uppercase tracking-wide text-emerald-200/80"
              />
            </div>

            {previousPeriodFilters ? (
              <div className="rounded-xl border border-violet-700/30 bg-violet-500/10 p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-wide text-violet-200/80">Поточний період vs попередній</p>
                  <p className="text-[11px] text-violet-100/70">{previousPeriodFilters.start_date} - {previousPeriodFilters.end_date}</p>
                </div>
                {isPreviousLotAnalyticsLoading ? (
                  <p className="text-sm text-gray-300">Завантаження порівняння...</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    {comparisonCards.map((card) => (
                      <MetricComparisonCard
                        key={card.key}
                        title={card.title}
                        current={'format' in card && card.format === 'percent' ? formatPercent(card.current) : formatNumber(card.current)}
                        previous={'format' in card && card.format === 'percent' ? formatPercent(card.previous) : formatNumber(card.previous)}
                        delta={card.delta}
                        deltaTone={card.deltaTone}
                        className="rounded-xl border border-violet-700/20 bg-gray-950/50 p-3"
                        titleClassName="text-xs uppercase tracking-wide text-violet-100/70"
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-2 xl:grid-cols-3">
              {sourceBreakdownCards.map((card) => (
                <div key={card.key} className={`rounded-xl border p-3 ${card.accentClass}`}>
                  <p className={`text-xs uppercase tracking-wide ${card.labelClass}`}>{card.title}</p>
                  {((card.key === 'WEB' && isWebAnalyticsLoading) || (card.key === 'TMA' && isTmaAnalyticsLoading) || (card.key === 'STAFF' && isStaffAnalyticsLoading)) ? (
                    <p className="mt-2 text-sm text-gray-300">Завантаження...</p>
                  ) : (
                    <>
                      <div className="mt-3 grid grid-cols-1 gap-2">
                        {[
                          { key: 'views', title: 'Перегляди', value: buildSourceMetricComparison(card.report?.totals.views ?? 0, card.previousReport?.totals.views ?? 0) },
                          { key: 'favorites', title: 'Збереження', value: buildSourceMetricComparison(card.report?.totals.favorites_added ?? 0, card.previousReport?.totals.favorites_added ?? 0) },
                          { key: 'orders', title: 'Замовлення', value: buildSourceMetricComparison(card.report?.totals.orders_created ?? 0, card.previousReport?.totals.orders_created ?? 0) },
                        ].map((metric) => (
                          <MetricComparisonCard
                            key={`${card.key}-${metric.key}`}
                            title={metric.title}
                            current={formatNumber(metric.value.current)}
                            previous={formatNumber(metric.value.previous)}
                            delta={metric.value.delta}
                            deltaTone={metric.value.deltaTone}
                            compact
                            className="rounded-lg border border-gray-800/60 bg-gray-950/50 p-2"
                            titleClassName="text-[11px] uppercase tracking-wide text-gray-400"
                          />
                        ))}
                      </div>
                      <p className="mt-3 text-xs font-semibold text-white">Конверсія: {formatPercent(card.report?.totals.conversion_rate ?? 0)}{card.previousReport ? <span className={`ml-2 ${buildDeltaTone(card.report?.totals.conversion_rate ?? 0, card.previousReport.totals.conversion_rate)}`}>{buildDeltaValue(card.report?.totals.conversion_rate ?? 0, card.previousReport.totals.conversion_rate)}</span> : null}</p>
                    </>
                  )}
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-wider text-gray-400">Лінійний графік переглядів</p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
                    Поточний період
                  </span>
                  {previousPeriodFilters ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-0.5 w-6 rounded-full bg-violet-300" />
                      Попередній період
                    </span>
                  ) : null}
                </div>
              </div>
              <AnalyticsLineChart
                current={preparedDailyRows.map((point) => ({ label: point.date, value: point.views }))}
                previous={(previousLotAnalyticsReport?.daily ?? []).map((point) => ({ label: point.date, value: point.views }))}
              />
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-wider text-gray-400">Динаміка по {lotAnalyticsPeriodLabel}</p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" />Перегляди</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />Збереження</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Замовлення</span>
                </div>
              </div>
              {stackedDailyRows.length === 0 ? <p className="text-sm text-gray-400">Немає подій за вибраний період.</p> : (
                <div className="space-y-2.5">
                  {stackedDailyRows.map((point) => (
                    <div key={point.date} className="grid grid-cols-[92px_1fr] items-center gap-3">
                      <div className="text-xs text-gray-400">{point.date}</div>
                      <div className="flex items-center gap-3">
                        <div className="relative flex-1">
                          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2"><div className="h-1.5 overflow-hidden rounded-full bg-gray-900"><div className="h-full rounded-full border border-violet-300/80 bg-violet-400/20" style={{ width: point.previousTotalWidth }} /></div></div>
                          <div className="relative h-3 overflow-hidden rounded-full bg-gray-800"><div className="flex h-full overflow-hidden rounded-full" style={{ width: point.totalWidth }}><div className="h-full bg-blue-500" style={{ width: point.stackedViewWidth }} /><div className="h-full bg-amber-500" style={{ width: point.stackedFavoriteWidth }} /><div className="h-full bg-emerald-500" style={{ width: point.stackedOrderWidth }} /></div></div>
                        </div>
                        <div className="grid min-w-[108px] grid-cols-3 gap-2 text-right text-xs text-white"><span>{point.views}</span><span>{point.favorites_added}</span><span>{point.orders_created}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {previousPeriodFilters ? <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-gray-800 pt-3 text-[11px] text-gray-400"><div className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-gray-700" />Поточний період</div><div className="inline-flex items-center gap-2"><span className="h-1.5 w-6 rounded-full border border-violet-300/80 bg-violet-400/20" />Попередній період overlay</div></div> : null}
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
              <div className="mb-3 flex items-center justify-between gap-3"><p className="text-xs uppercase tracking-wider text-gray-400">Конверсія по {lotAnalyticsPeriodLabel}</p><p className="text-[11px] text-gray-500">Замовлення / перегляди</p></div>
              {preparedConversionRows.length === 0 ? <p className="text-sm text-gray-400">Немає подій за вибраний період.</p> : <div className="space-y-2.5">{preparedConversionRows.map((point) => (<div key={`conversion-${point.date}`} className="grid grid-cols-[92px_1fr] items-center gap-3"><div className="text-xs text-gray-400">{point.date}</div><div className="flex items-center gap-3"><div className="h-3 flex-1 overflow-hidden rounded-full bg-gray-800"><div className="h-full rounded-full bg-fuchsia-500" style={{ width: point.conversionWidth }} /></div><span className="min-w-[56px] text-right text-xs font-semibold text-white">{formatPercent(point.conversionRate)}</span></div></div>))}</div>}
            </div>

            {lotAnalyticsFilters.lot_id ? (
              <div className="rounded-xl border border-blue-700/30 bg-blue-950/20 p-3">
                <p className="mb-2 text-xs uppercase tracking-wider text-blue-200/80">Drill-down по вибраному лоту</p>
                <p className="text-sm font-semibold text-white">{(() => {
                  const selectedInventoryLot = analyticsLots.find((lot) => lot.id === lotAnalyticsFilters.lot_id);
                  if (selectedInventoryLot) return [selectedInventoryLot.brand, selectedInventoryLot.model].filter(Boolean).join(' · ') || selectedInventoryLot.id;
                  const selectedAnalyticsLot = lotAnalyticsReport.top_viewed.find((row) => row.lot_id === lotAnalyticsFilters.lot_id);
                  if (selectedAnalyticsLot) return [selectedAnalyticsLot.brand, selectedAnalyticsLot.model].filter(Boolean).join(' · ') || selectedAnalyticsLot.lot_id;
                  return lotAnalyticsFilters.lot_id;
                })()}</p>
                <p className="mt-1 text-xs text-blue-100/70">Окрема часова серія нижче вже показує лише цей лот, без домішування інших позицій.</p>
              </div>
            ) : null}

            {activeTopSection ? (
              <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-wider text-gray-400">{activeTopSection.title}</p>
                  <div className="flex flex-wrap gap-2">
                    {[{ key: 'views', label: 'Перегляди' }, { key: 'favorites_added', label: 'Збереження' }, { key: 'conversion_rate', label: 'Конверсія' }].map((option) => (
                      <button key={option.key} type="button" onClick={() => setTopMetric(option.key as typeof topMetric)} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${topMetric === option.key ? 'border-blue-700/60 bg-blue-900/40 text-blue-100' : 'border-gray-700 bg-gray-900 text-gray-300 hover:bg-gray-800'}`}>{option.label}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {activeTopSection.rows.length === 0 ? <p className="text-sm text-gray-400">Немає даних.</p> : activeTopSection.rows.map((row) => (
                    <div key={`${activeTopSection.title}-${row.lot_id}`} className="rounded-lg border border-gray-800 bg-gray-900 p-2">
                      <p className="text-sm font-semibold text-white">{buildLotLabel(row)}</p>
                      <p className="mt-1 text-xs text-gray-500">{row.type} • {row.condition} • перегляди {row.views} • збереження {row.favorites_added} • замовлення {row.orders_created}</p>
                      <p className="mt-1 text-xs font-semibold text-emerald-300">{activeTopSection.metricKey === 'conversion_rate' ? `${activeTopSection.metricLabel}: ${formatPercent(row.conversion_rate)}` : `${activeTopSection.metricLabel}: ${formatNumber(row[activeTopSection.metricKey])}`}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </article>
    </section>
  );
}
