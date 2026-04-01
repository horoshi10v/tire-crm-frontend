import { useMemo } from 'react';
import type { LotAnalyticsReport, LotAnalyticsReportFilters } from '../types/adminReports';
import { buildDeltaTone, buildDeltaValue, totalDailyPoint } from '../utils/adminLotAnalytics';

type TopMetric = 'views' | 'favorites_added' | 'conversion_rate';

export const useAdminLotAnalyticsPresentation = ({
  report,
  previousReport,
  previousPeriodFilters,
  topMetric,
}: {
  report?: LotAnalyticsReport;
  previousReport?: LotAnalyticsReport;
  previousPeriodFilters: LotAnalyticsReportFilters | null;
  topMetric: TopMetric;
}) => {
  const preparedDailyRows = useMemo(() => {
    return (report?.daily ?? []).map((point) => ({
      ...point,
      total: totalDailyPoint(point),
      conversionRate: point.views > 0 ? point.orders_created / point.views : 0,
    }));
  }, [report]);

  const stackedDailyRows = useMemo(() => {
    const previousDailyRows = previousReport?.daily ?? [];
    const maxTotal = Math.max(
      1,
      ...preparedDailyRows.map((point) => point.total),
      ...previousDailyRows.map((point) => totalDailyPoint(point))
    );

    return preparedDailyRows.map((point) => {
      const totalWidth = (point.total / maxTotal) * 100;
      const safeTotal = Math.max(point.total, 1);
      const previousPoint = previousDailyRows.find((previousRow) => previousRow.date === point.date) ?? null;
      const previousTotal = previousPoint ? totalDailyPoint(previousPoint) : 0;

      return {
        ...point,
        totalWidth: `${totalWidth}%`,
        previousTotalWidth: `${(previousTotal / maxTotal) * 100}%`,
        stackedViewWidth: `${(point.views / safeTotal) * 100}%`,
        stackedFavoriteWidth: `${(point.favorites_added / safeTotal) * 100}%`,
        stackedOrderWidth: `${(point.orders_created / safeTotal) * 100}%`,
      };
    });
  }, [preparedDailyRows, previousReport]);

  const conversionChartMax = useMemo(() => {
    return preparedDailyRows.reduce((maxValue, point) => Math.max(maxValue, point.conversionRate), 0);
  }, [preparedDailyRows]);

  const preparedConversionRows = useMemo(() => {
    const safeMax = conversionChartMax > 0 ? conversionChartMax : 1;
    return preparedDailyRows.map((point) => ({
      ...point,
      conversionWidth: `${(point.conversionRate / safeMax) * 100}%`,
    }));
  }, [conversionChartMax, preparedDailyRows]);

  const periodLabel = useMemo(() => {
    switch (report?.group_by ?? 'DAY') {
      case 'WEEK':
        return 'тижнях';
      case 'MONTH':
        return 'місяцях';
      default:
        return 'днях';
    }
  }, [report?.group_by]);

  const comparisonCards = useMemo(() => {
    if (!report || !previousReport || !previousPeriodFilters) {
      return [];
    }

    return [
      {
        key: 'views',
        title: 'Перегляди',
        current: report.totals.views,
        previous: previousReport.totals.views,
        delta: buildDeltaValue(report.totals.views, previousReport.totals.views),
        deltaTone: buildDeltaTone(report.totals.views, previousReport.totals.views),
      },
      {
        key: 'favorites',
        title: 'Збереження',
        current: report.totals.favorites_added,
        previous: previousReport.totals.favorites_added,
        delta: buildDeltaValue(report.totals.favorites_added, previousReport.totals.favorites_added),
        deltaTone: buildDeltaTone(report.totals.favorites_added, previousReport.totals.favorites_added),
      },
      {
        key: 'orders',
        title: 'Замовлення',
        current: report.totals.orders_created,
        previous: previousReport.totals.orders_created,
        delta: buildDeltaValue(report.totals.orders_created, previousReport.totals.orders_created),
        deltaTone: buildDeltaTone(report.totals.orders_created, previousReport.totals.orders_created),
      },
      {
        key: 'conversion',
        title: 'Конверсія',
        current: report.totals.conversion_rate,
        previous: previousReport.totals.conversion_rate,
        delta: buildDeltaValue(report.totals.conversion_rate, previousReport.totals.conversion_rate),
        deltaTone: buildDeltaTone(report.totals.conversion_rate, previousReport.totals.conversion_rate),
        format: 'percent' as const,
      },
    ];
  }, [previousPeriodFilters, previousReport, report]);

  const activeTopSection = useMemo(() => {
    if (!report) {
      return null;
    }

    if (topMetric === 'favorites_added') {
      return {
        title: 'Топ збережень',
        rows: report.top_favorited,
        metricLabel: 'Збереження',
        metricKey: 'favorites_added' as const,
      };
    }

    if (topMetric === 'conversion_rate') {
      return {
        title: 'Топ конверсії',
        rows: report.top_converting,
        metricLabel: 'Конверсія',
        metricKey: 'conversion_rate' as const,
      };
    }

    return {
      title: 'Топ переглядів',
      rows: report.top_viewed,
      metricLabel: 'Перегляди',
      metricKey: 'views' as const,
    };
  }, [report, topMetric]);

  return {
    preparedDailyRows,
    stackedDailyRows,
    preparedConversionRows,
    periodLabel,
    comparisonCards,
    activeTopSection,
  };
};
