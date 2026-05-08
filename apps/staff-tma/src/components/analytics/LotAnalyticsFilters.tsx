import type { LotAnalyticsReportFilters } from '../../types/adminReports';
import type { LotInternalResponse as Lot } from '../../types/lot';
import type { Warehouse } from '../../types/warehouse';

type PresetDays = 0 | 7 | 30 | 90;

interface LotAnalyticsFiltersProps {
  filters: LotAnalyticsReportFilters;
  onFiltersChange: (filters: LotAnalyticsReportFilters) => void;
  onApply: () => void;
  onReset: () => void;
  onApplyPreset: (days: PresetDays) => void;
  warehouses: Warehouse[];
  lots: Lot[];
}

export default function LotAnalyticsFilters({
  filters,
  onFiltersChange,
  onApply,
  onReset,
  onApplyPreset,
  warehouses,
  lots,
}: LotAnalyticsFiltersProps) {
  const handleFilterChange = <K extends keyof LotAnalyticsReportFilters>(key: K, value: LotAnalyticsReportFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-6">
        <label className="space-y-1">
          <span className="text-sm text-gray-300">Дата початку</span>
          <input
            type="date"
            value={filters.start_date ?? ''}
            onChange={(e) => handleFilterChange('start_date', e.target.value || undefined)}
            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-gray-300">Дата завершення</span>
          <input
            type="date"
            value={filters.end_date ?? ''}
            onChange={(e) => handleFilterChange('end_date', e.target.value || undefined)}
            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-gray-300">Склад</span>
          <select
            value={filters.warehouse_id ?? ''}
            onChange={(e) => handleFilterChange('warehouse_id', e.target.value || undefined)}
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
            value={filters.type ?? ''}
            onChange={(e) => handleFilterChange('type', (e.target.value || undefined) as LotAnalyticsReportFilters['type'])}
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
            value={filters.brand ?? ''}
            onChange={(e) => handleFilterChange('brand', e.target.value || undefined)}
            placeholder="Michelin, Hankook..."
            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-gray-300">Модель</span>
          <input
            type="text"
            value={filters.model ?? ''}
            onChange={(e) => handleFilterChange('model', e.target.value || undefined)}
            placeholder="Pilot Sport 4, Enasave..."
            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-gray-300">Стан</span>
          <select
            value={filters.condition ?? ''}
            onChange={(e) => handleFilterChange('condition', (e.target.value || undefined) as LotAnalyticsReportFilters['condition'])}
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
            value={filters.source ?? ''}
            onChange={(e) => handleFilterChange('source', (e.target.value || undefined) as LotAnalyticsReportFilters['source'])}
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
            value={filters.group_by ?? 'DAY'}
            onChange={(e) => handleFilterChange('group_by', (e.target.value || 'DAY') as LotAnalyticsReportFilters['group_by'])}
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
            value={filters.top_limit ?? 10}
            onChange={(e) => handleFilterChange('top_limit', Number(e.target.value) as LotAnalyticsReportFilters['top_limit'])}
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
            value={filters.lot_id ?? ''}
            onChange={(e) => handleFilterChange('lot_id', e.target.value || undefined)}
            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
          >
            <option value="">Усі лоти</option>
            {lots
              .filter((lot) => !filters.type || lot.type === filters.type)
              .map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {[lot.brand, lot.model].filter(Boolean).join(' · ') || lot.id}
                </option>
              ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onApply}
          className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 sm:flex-none"
        >
          Застосувати фільтр
        </button>
        <button
          type="button"
          onClick={onReset}
          className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-200 transition hover:bg-gray-700 sm:flex-none"
        >
          Скинути
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Сьогодні', days: 0 as const },
          { label: '7 днів', days: 7 as const },
          { label: '30 днів', days: 30 as const },
          { label: '90 днів', days: 90 as const },
        ].map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onApplyPreset(preset.days)}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-xs font-semibold text-gray-200 transition hover:bg-gray-700"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
