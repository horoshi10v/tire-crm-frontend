import { useMemo, useState } from 'react';
import { useAdminLotAnalyticsReport } from '../api/adminReports';
import { useStaffLots } from '../api/staffLots';
import { useStaffWarehouses } from '../api/staffWarehouses';
import type { LotAnalyticsReportFilters } from '../types/adminReports';
import MetricComparisonCard from '../components/MetricComparisonCard';
import { useAdminLotAnalyticsPresentation } from '../hooks/useAdminLotAnalyticsPresentation';
import {
  buildDeltaTone,
  buildDeltaValue,
  buildSourceMetricComparison,
  calculatePreviousPeriodFilters,
  createInitialLotAnalyticsFilters,
  extractApiErrorMessage,
  formatDateInput,
  formatNumber,
  formatPercent,
  sortAnalyticsLots,
} from '../utils/adminLotAnalytics';
import LotAnalyticsFilters from '../components/analytics/LotAnalyticsFilters';
import AnalyticsChart from '../components/analytics/AnalyticsChart';
import TopLotsSection from '../components/analytics/TopLotsSection';

export default function AdminLotAnalyticsView() {
  const [topMetric, setTopMetric] = useState<'views' | 'favorites_added' | 'conversion_rate'>('views');
  const [lotAnalyticsFilters, setLotAnalyticsFilters] = useState<LotAnalyticsReportFilters>(
    createInitialLotAnalyticsFilters()
  );
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

  const nivoData = useMemo(() => {
    if (!lotAnalyticsReport) return [];
    const currentData = preparedDailyRows.map((point) => ({
      x: point.date,
      y: point.views,
    }));

    const previousData = (previousLotAnalyticsReport?.daily ?? []).map((point) => ({
      x: point.date,
      y: point.views,
    }));

    const series = [{ id: 'Поточний', data: currentData }];
    if (previousLotAnalyticsReport) {
      series.push({ id: 'Попередній', data: previousData });
    }

    return series;
  }, [preparedDailyRows, lotAnalyticsReport, previousLotAnalyticsReport]);

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
        <div className="mb-3">
          <h3 className="text-base font-semibold text-white">Аналітика лотів</h3>
          <p className="text-sm text-gray-400">Перегляди, збереження в обране та конверсія в оформлення.</p>
        </div>

        <LotAnalyticsFilters
          filters={lotAnalyticsFilters}
          onFiltersChange={setLotAnalyticsFilters}
          onApply={applyLotAnalyticsFilters}
          onReset={resetLotAnalyticsFilters}
          onApplyPreset={applyPresetRange}
          warehouses={warehouses}
          lots={analyticsLots}
        />

        {lotAnalyticsError ? (
          <div className="mt-3 rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {lotAnalyticsError}
          </div>
        ) : null}
        {isLotAnalyticsLoading ? (
          <div className="mt-3 rounded-xl border border-gray-800 bg-gray-950 p-4 text-sm text-gray-400">
            Завантаження аналітики...
          </div>
        ) : null}
        {isLotAnalyticsRequestError ? (
          <div className="mt-3 rounded-xl border border-red-800/60 bg-red-950/30 p-4 text-sm text-red-300">
            Не вдалося отримати аналітику: {extractApiErrorMessage(lotAnalyticsRequestError)}
          </div>
        ) : null}

        {!isLotAnalyticsLoading && !isLotAnalyticsRequestError && lotAnalyticsReport ? (
          <div className="mt-3 space-y-4">
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              <MetricComparisonCard title="Перегляди" current={formatNumber(lotAnalyticsReport.totals.views)} />
              <MetricComparisonCard
                title="Збереження"
                current={formatNumber(lotAnalyticsReport.totals.favorites_added)}
              />
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
                <div className="mb-3 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
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
                      <MetricComparisonCard
                        key={card.key}
                        title={card.title}
                        current={
                          'format' in card && card.format === 'percent'
                            ? formatPercent(card.current)
                            : formatNumber(card.current)
                        }
                        previous={
                          'format' in card && card.format === 'percent'
                            ? formatPercent(card.previous)
                            : formatNumber(card.previous)
                        }
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
                  {(card.key === 'WEB' && isWebAnalyticsLoading) ||
                  (card.key === 'TMA' && isTmaAnalyticsLoading) ||
                  (card.key === 'STAFF' && isStaffAnalyticsLoading) ? (
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
                      <p className="mt-3 text-xs font-semibold text-white">
                        Конверсія: {formatPercent(card.report?.totals.conversion_rate ?? 0)}
                        {card.previousReport ? (
                          <span
                            className={`ml-2 ${buildDeltaTone(
                              card.report?.totals.conversion_rate ?? 0,
                              card.previousReport.totals.conversion_rate
                            )}`}
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

            <AnalyticsChart data={nivoData} hasPreviousPeriod={Boolean(previousPeriodFilters)} />

            <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
              <div className="mb-3 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                <p className="text-xs uppercase tracking-wider text-gray-400">
                  Конверсія по {lotAnalyticsPeriodLabel}
                </p>
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
                          <div
                            className="h-full rounded-full bg-fuchsia-500"
                            style={{ width: point.conversionWidth }}
                          />
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

            <TopLotsSection
              activeTopSection={activeTopSection}
              topMetric={topMetric}
              onTopMetricChange={setTopMetric}
            />
          </div>
        ) : null}
      </article>
    </section>
  );
}
