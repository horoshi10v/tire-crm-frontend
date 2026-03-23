import type { StaffLotFilters } from '../types/lot';
import type { Warehouse } from '../types/warehouse';

type InventoryFiltersDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  filters: StaffLotFilters;
  onSetFilter: <K extends keyof StaffLotFilters>(key: K, value: StaffLotFilters[K]) => void;
  onReset: () => void;
  warehouses: Warehouse[];
};

export default function InventoryFiltersDrawer({
  isOpen,
  onClose,
  filters,
  onSetFilter,
  onReset,
  warehouses,
}: InventoryFiltersDrawerProps) {
  return (
    <div
      className={`fixed inset-0 z-[75] flex flex-col justify-end transition-opacity duration-300 ${
        isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
    >
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />

      <div
        className={`relative max-h-[85vh] w-full rounded-t-2xl border-t border-gray-800 bg-gray-900 p-4 transition-transform duration-300 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Фільтри товарів</h2>
          <button onClick={onClose} className="text-3xl leading-none text-gray-400 hover:text-white">
            &times;
          </button>
        </div>

        <div className="flex max-h-[62vh] flex-col gap-5 overflow-y-auto pb-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-gray-400">Тип</label>
              <select
                value={filters.type}
                onChange={(event) => onSetFilter('type', event.target.value as StaffLotFilters['type'])}
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500"
              >
                <option value="">Всі</option>
                <option value="TIRE">Шини</option>
                <option value="RIM">Диски</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-gray-400">Стан</label>
              <select
                value={filters.condition}
                onChange={(event) => onSetFilter('condition', event.target.value as StaffLotFilters['condition'])}
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500"
              >
                <option value="">Будь-який</option>
                <option value="NEW">Нові</option>
                <option value="USED">Вживані</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-gray-400">Склад</label>
            <select
              value={filters.warehouse_id}
              onChange={(event) => onSetFilter('warehouse_id', event.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500"
            >
              <option value="">Усі склади</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name} ({warehouse.location})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-gray-400">Сезон</label>
            <div className="relative z-0 flex rounded-xl bg-gray-800 p-1">
              <div className="pointer-events-none absolute inset-1 -z-10">
                <div
                  className="h-full w-1/4 rounded-lg bg-blue-600 shadow-md"
                  style={{
                    transform: `translateX(${['', 'SUMMER', 'WINTER', 'ALL_SEASON'].indexOf(filters.season) * 100}%)`,
                    transition: 'transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                />
              </div>

              {['', 'SUMMER', 'WINTER', 'ALL_SEASON'].map((season) => (
                <button
                  key={season}
                  type="button"
                  onClick={() => onSetFilter('season', season as StaffLotFilters['season'])}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-medium transition-colors duration-300 ${
                    filters.season === season ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {season === '' ? 'Всі' : season === 'SUMMER' ? 'Літо' : season === 'WINTER' ? 'Зима' : 'Всесезон'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-gray-400">
              Параметри (Шир / Проф / Радіус)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                placeholder="Шир"
                value={filters.width}
                onChange={(event) => onSetFilter('width', event.target.value ? Number(event.target.value) : '')}
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-2 py-2.5 text-center text-sm text-white outline-none transition-colors focus:border-blue-500"
              />
              <input
                type="number"
                placeholder="Проф"
                value={filters.profile}
                onChange={(event) => onSetFilter('profile', event.target.value ? Number(event.target.value) : '')}
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-2 py-2.5 text-center text-sm text-white outline-none transition-colors focus:border-blue-500"
              />
              <input
                type="number"
                placeholder="Радіус"
                value={filters.diameter}
                onChange={(event) => onSetFilter('diameter', event.target.value ? Number(event.target.value) : '')}
                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-2 py-2.5 text-center text-sm text-white outline-none transition-colors focus:border-blue-500"
              />
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-4 rounded-xl border border-gray-800 bg-gray-800/50 p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={filters.is_run_flat}
                onChange={(event) => onSetFilter('is_run_flat', event.target.checked)}
                className="h-5 w-5 rounded border-gray-600 bg-gray-700 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-200">Run Flat</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={filters.is_spiked}
                onChange={(event) => onSetFilter('is_spiked', event.target.checked)}
                className="h-5 w-5 rounded border-gray-600 bg-gray-700 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-200">Шиповані</span>
            </label>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={filters.anti_puncture}
                onChange={(event) => onSetFilter('anti_puncture', event.target.checked)}
                className="h-5 w-5 rounded border-gray-600 bg-gray-700 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-200">Антипрокол</span>
            </label>
          </div>
        </div>

        <div className="mt-auto flex gap-3 border-t border-gray-800 pt-4">
          <button
            onClick={() => {
              onReset();
              onClose();
            }}
            className="flex-1 rounded-xl bg-gray-800 py-3.5 font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
          >
            Скинути
          </button>
          <button
            onClick={onClose}
            className="flex-[2] rounded-xl bg-blue-600 py-3.5 font-bold text-white shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] hover:bg-blue-500"
          >
            Застосувати
          </button>
        </div>
      </div>
    </div>
  );
}
