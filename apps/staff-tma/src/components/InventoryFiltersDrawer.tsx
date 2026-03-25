import { CountrySearchSelect } from '@tire-crm/shared';
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
  const isAccessory = filters.type === 'ACCESSORY';
  const isRim = filters.type === 'RIM';
  const rimMaterialOptions = [
    { value: '', label: 'Будь-який сплав' },
    { value: 'STEEL', label: 'Металеві' },
    { value: 'ALLOY', label: 'Легкосплавні' },
  ] as const;

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
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-gray-400">Сортування</label>
            <select
              value={`${filters.sort_by}:${filters.sort_order}`}
              onChange={(event) => {
                const [sortBy, sortOrder] = event.target.value.split(':') as [StaffLotFilters['sort_by'], StaffLotFilters['sort_order']];
                onSetFilter('sort_by', sortBy);
                onSetFilter('sort_order', sortOrder);
              }}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500"
            >
              <option value="popularity:desc">За популярністю</option>
              <option value="created_at:desc">За новизною</option>
              <option value="price:asc">Ціна: від дешевих</option>
              <option value="price:desc">Ціна: від дорогих</option>
              <option value="stock:desc">Спочатку в наявності</option>
            </select>
          </div>

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
                <option value="ACCESSORY">Супутні товари</option>
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

          {isAccessory ? (
            <>
              <div>
                <label className="mb-1 block text-xs uppercase tracking-wider text-gray-400">Категорія</label>
                <select
                  value={filters.accessory_category}
                  onChange={(event) => onSetFilter('accessory_category', event.target.value as StaffLotFilters['accessory_category'])}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500"
                >
                  <option value="">Усі</option>
                  <option value="FASTENERS">Кріплення</option>
                  <option value="HUB_RINGS">Проставочні кільця</option>
                  <option value="SPACERS">Проставки</option>
                  <option value="TIRE_BAGS">Пакети для шин</option>
                </select>
              </div>

              {filters.accessory_category === 'FASTENERS' ? (
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={filters.fastener_type}
                    onChange={(event) => onSetFilter('fastener_type', event.target.value as StaffLotFilters['fastener_type'])}
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500"
                  >
                    <option value="">Гайки і болти</option>
                    <option value="NUT">Гайки</option>
                    <option value="BOLT">Болти</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Різьба"
                    value={filters.thread_size}
                    onChange={(event) => onSetFilter('thread_size', event.target.value)}
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="Тип посадки"
                    value={filters.seat_type}
                    onChange={(event) => onSetFilter('seat_type', event.target.value)}
                    className="col-span-2 w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500"
                  />
                </div>
              ) : null}

              {filters.accessory_category === 'HUB_RINGS' ? (
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Внутр. діаметр"
                    value={filters.ring_inner_diameter}
                    onChange={(event) => onSetFilter('ring_inner_diameter', event.target.value ? Number(event.target.value) : '')}
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Зовн. діаметр"
                    value={filters.ring_outer_diameter}
                    onChange={(event) => onSetFilter('ring_outer_diameter', event.target.value ? Number(event.target.value) : '')}
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500"
                  />
                </div>
              ) : null}

              {filters.accessory_category === 'SPACERS' ? (
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={filters.spacer_type}
                    onChange={(event) => onSetFilter('spacer_type', event.target.value as StaffLotFilters['spacer_type'])}
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500"
                  >
                    <option value="">Усі проставки</option>
                    <option value="ADAPTER">Адаптери</option>
                    <option value="EXTENDER">Розширювальні</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Товщина, мм"
                    value={filters.spacer_thickness}
                    onChange={(event) => onSetFilter('spacer_thickness', event.target.value ? Number(event.target.value) : '')}
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500"
                  />
                </div>
              ) : null}

              {filters.accessory_category === 'TIRE_BAGS' ? (
                <input
                  type="number"
                  placeholder="Кількість у комплекті"
                  value={filters.package_quantity}
                  onChange={(event) => onSetFilter('package_quantity', event.target.value ? Number(event.target.value) : '')}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500"
                />
              ) : null}
            </>
          ) : (
            <>
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

              {isRim ? (
                <div className="grid grid-cols-1 gap-3">
                  <select
                    value={filters.rim_material}
                    onChange={(event) => onSetFilter('rim_material', event.target.value as StaffLotFilters['rim_material'])}
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500"
                  >
                    {rimMaterialOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="PCD"
                    value={filters.pcd}
                    onChange={(event) => onSetFilter('pcd', event.target.value)}
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="DIA"
                    value={filters.dia}
                    onChange={(event) => onSetFilter('dia', event.target.value ? Number(event.target.value) : '')}
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500"
                  />
                  <input
                    type="number"
                    step="0.1"
                    placeholder="ET"
                    value={filters.et}
                    onChange={(event) => onSetFilter('et', event.target.value ? Number(event.target.value) : '')}
                    className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500"
                  />
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Рік випуску"
                  value={filters.production_year}
                  onChange={(event) => onSetFilter('production_year', event.target.value ? Number(event.target.value) : '')}
                  className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-blue-500"
                />
                <CountrySearchSelect
                  value={filters.country_of_origin}
                  onChange={(value) => onSetFilter('country_of_origin', value)}
                  emptyLabel="Усі країни"
                  placeholder="Країна виробник"
                />
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
            </>
          )}
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
