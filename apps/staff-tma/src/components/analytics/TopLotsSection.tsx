import { buildLotLabel, formatNumber, formatPercent } from '../../utils/adminLotAnalytics';
import type { LotAnalyticsLotRow } from '../../types/adminReports';

interface TopLotsSectionProps {
  activeTopSection: {
    title: string;
    rows: LotAnalyticsLotRow[];
    metricKey: 'views' | 'favorites_added' | 'conversion_rate';
    metricLabel: string;
  } | null;
  topMetric: 'views' | 'favorites_added' | 'conversion_rate';
  onTopMetricChange: (metric: 'views' | 'favorites_added' | 'conversion_rate') => void;
}

export default function TopLotsSection({
  activeTopSection,
  topMetric,
  onTopMetricChange,
}: TopLotsSectionProps) {
  if (!activeTopSection) return null;

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
      <div className="mb-3 flex flex-col flex-wrap items-start justify-between gap-3 sm:flex-row sm:items-center">
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
              onClick={() => onTopMetricChange(option.key as typeof topMetric)}
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
                {row.type} • {row.condition} • перегляди {row.views} • збереження {row.favorites_added} • замовлення{' '}
                {row.orders_created}
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
  );
}
