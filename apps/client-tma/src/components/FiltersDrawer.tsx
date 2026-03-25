// apps/client-tma/src/components/FiltersDrawer.tsx
import { CountrySearchSelect } from '@tire-crm/shared';
import { useFilterStore } from '../store/useFilterStore';
import { ResponsiveSelect } from './ResponsiveSelect';

interface FiltersDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const FiltersDrawer = ({ isOpen, onClose }: FiltersDrawerProps) => {
    const { filters, setFilter, resetFilters } = useFilterStore();
    const isAccessory = filters.type === 'ACCESSORY';
    const isRim = filters.type === 'RIM';
    const isTire = filters.type === 'TIRE';
    const typeOptions = [
        { value: '', label: 'Всі' },
        { value: 'TIRE', label: 'Шини' },
        { value: 'RIM', label: 'Диски' },
        { value: 'ACCESSORY', label: 'Супутні товари' },
    ];
    const conditionOptions = [
        { value: '', label: 'Будь-який' },
        { value: 'NEW', label: 'Нові' },
        { value: 'USED', label: 'Вживані' },
    ];
    const accessoryCategoryOptions = [
        { value: '', label: 'Усі' },
        { value: 'FASTENERS', label: 'Кріплення' },
        { value: 'HUB_RINGS', label: 'Проставочні кільця' },
        { value: 'SPACERS', label: 'Проставки' },
        { value: 'TIRE_BAGS', label: 'Пакети для шин' },
    ];
    const fastenerTypeOptions = [
        { value: '', label: 'Гайки і болти' },
        { value: 'NUT', label: 'Гайки' },
        { value: 'BOLT', label: 'Болти' },
    ];
    const spacerTypeOptions = [
        { value: '', label: 'Усі проставки' },
        { value: 'ADAPTER', label: 'Адаптери' },
        { value: 'EXTENDER', label: 'Розширювальні' },
    ];
    const rimMaterialOptions = [
        { value: '', label: 'Будь-який сплав' },
        { value: 'STEEL', label: 'Металеві' },
        { value: 'ALLOY', label: 'Легкосплавні' },
    ];

    return (
        // Загальний контейнер (Фон).
        // pointer-events-none вимикає кліки, коли шторка закрита, щоб не блокувати UI.
        <div
            className={`fixed inset-0 z-50 flex flex-col justify-end xl:flex-row xl:justify-end transition-opacity duration-300 ${
                isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
        >
            {/* Затемнений фон (60% чорного) */}
            <div
                className="absolute inset-0 bg-black/60"
                onClick={onClose}
                aria-hidden="true"
            ></div>

            {/* Сама шторка з анімацією виїзду знизу */}
            <div
                className={`relative bg-gray-900 w-full xl:w-[450px] rounded-t-2xl xl:rounded-none xl:rounded-l-2xl p-4 border-t xl:border-t-0 xl:border-l border-gray-800 flex flex-col max-h-[85vh] xl:max-h-full xl:h-full transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-y-0 xl:translate-x-0' : 'translate-y-full xl:translate-y-0 xl:translate-x-full'
                }`}
            >
                {/* Шапка шторки */}
                <div className="flex justify-between items-center mb-5">
                    <h2 className="text-xl font-bold text-white">Фільтри</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                </div>

                {/* Контент фільтрів */}
                <div className="overflow-y-auto flex-grow flex flex-col gap-5 pb-4">

                    {/* Тип та Стан */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">Тип</label>
                            <ResponsiveSelect value={filters.type} onChange={(value) => setFilter('type', value)} options={typeOptions} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">Стан</label>
                            <ResponsiveSelect value={filters.condition} onChange={(value) => setFilter('condition', value)} options={conditionOptions} />
                        </div>
                    </div>

                    {isAccessory ? (
                        <>
                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">Категорія</label>
                                    <ResponsiveSelect
                                        value={filters.accessory_category}
                                        onChange={(value) => setFilter('accessory_category', value)}
                                        options={accessoryCategoryOptions}
                                    />
                                </div>
                            </div>

                            {filters.accessory_category === 'FASTENERS' ? (
                                <div className="grid grid-cols-2 gap-2">
                                    <ResponsiveSelect
                                        value={filters.fastener_type}
                                        onChange={(value) => setFilter('fastener_type', value)}
                                        options={fastenerTypeOptions}
                                    />
                                    <input type="text" placeholder="Різьба, напр. M12x1.5" value={filters.thread_size} onChange={(e) => setFilter('thread_size', e.target.value)} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none focus:border-[#10AD0B]" />
                                    <input type="text" placeholder="Тип посадки" value={filters.seat_type} onChange={(e) => setFilter('seat_type', e.target.value)} className="col-span-2 w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none focus:border-[#10AD0B]" />
                                </div>
                            ) : null}

                            {filters.accessory_category === 'HUB_RINGS' ? (
                                <div className="grid grid-cols-2 gap-2">
                                    <input type="number" placeholder="Внутр. діаметр" value={filters.ring_inner_diameter} onChange={(e) => setFilter('ring_inner_diameter', e.target.value ? Number(e.target.value) : '')} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none focus:border-[#10AD0B]" />
                                    <input type="number" placeholder="Зовн. діаметр" value={filters.ring_outer_diameter} onChange={(e) => setFilter('ring_outer_diameter', e.target.value ? Number(e.target.value) : '')} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none focus:border-[#10AD0B]" />
                                </div>
                            ) : null}

                            {filters.accessory_category === 'SPACERS' ? (
                                <div className="grid grid-cols-2 gap-2">
                                    <ResponsiveSelect
                                        value={filters.spacer_type}
                                        onChange={(value) => setFilter('spacer_type', value)}
                                        options={spacerTypeOptions}
                                    />
                                    <input type="number" placeholder="Товщина, мм" value={filters.spacer_thickness} onChange={(e) => setFilter('spacer_thickness', e.target.value ? Number(e.target.value) : '')} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none focus:border-[#10AD0B]" />
                                </div>
                            ) : null}

                            {filters.accessory_category === 'TIRE_BAGS' ? (
                                <div className="grid grid-cols-1 gap-2">
                                    <input type="number" placeholder="Кількість у комплекті" value={filters.package_quantity} onChange={(e) => setFilter('package_quantity', e.target.value ? Number(e.target.value) : '')} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none focus:border-[#10AD0B]" />
                                </div>
                            ) : null}
                        </>
                    ) : (
                        <>
                            {isTire ? (
                                <div>
                                    <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">Сезон</label>
                                    <div className="relative flex bg-gray-800 rounded-xl p-1 z-0">
                                        <div className="absolute top-1 bottom-1 left-1 right-1 -z-10 pointer-events-none">
                                            <div
                                                className="h-full w-1/4 rounded-lg bg-[#10AD0B] shadow-md"
                                                style={{
                                                    transform: `translateX(${['', 'SUMMER', 'WINTER', 'ALL_SEASON'].indexOf(filters.season) * 100}%)`,
                                                    transition: 'transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1)'
                                                }}
                                            ></div>
                                        </div>

                                        {['', 'SUMMER', 'WINTER', 'ALL_SEASON'].map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setFilter('season', s)}
                                                className={`flex-1 text-xs py-2.5 rounded-lg font-medium transition-colors duration-300 ${
                                                    filters.season === s
                                                        ? 'text-white'
                                                        : 'text-gray-400 hover:text-gray-200'
                                                }`}
                                            >
                                                {s === '' ? 'Всі' : s === 'SUMMER' ? 'Літо' : s === 'WINTER' ? 'Зима' : 'Всесезон'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            <div>
                                <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">
                                    {isRim ? 'Параметри диска (J / R)' : 'Параметри (Шир / Проф / Радіус)'}
                                </label>
                                <div className={`grid gap-2 ${isTire ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                    <input type="number" step="0.1" placeholder={isRim ? 'Ширина J' : 'Ширина'} value={filters.width} onChange={(e) => setFilter('width', e.target.value ? Number(e.target.value) : '')} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-2 py-2.5 text-center text-sm text-white outline-none transition-colors focus:border-[#10AD0B]" />
                                    {isTire ? (
                                        <input type="number" step="0.1" placeholder="Профіль" value={filters.profile} onChange={(e) => setFilter('profile', e.target.value ? Number(e.target.value) : '')} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-2 py-2.5 text-center text-sm text-white outline-none transition-colors focus:border-[#10AD0B]" />
                                    ) : null}
                                    <input type="number" step="0.1" placeholder="Радіус R" value={filters.diameter} onChange={(e) => setFilter('diameter', e.target.value ? Number(e.target.value) : '')} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-2 py-2.5 text-center text-sm text-white outline-none transition-colors focus:border-[#10AD0B]" />
                                </div>
                            </div>

                            {isRim ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">Сплав</label>
                                        <ResponsiveSelect value={filters.rim_material} onChange={(value) => setFilter('rim_material', value)} options={rimMaterialOptions} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400 mb-1 block uppercase tracking-wider">PCD / DIA / ET</label>
                                        <div className="grid grid-cols-3 gap-2">
                                        <input type="text" placeholder="PCD" value={filters.pcd} onChange={(e) => setFilter('pcd', e.target.value)} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#10AD0B]" />
                                        <input type="number" step="0.1" placeholder="DIA" value={filters.dia} onChange={(e) => setFilter('dia', e.target.value ? Number(e.target.value) : '')} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#10AD0B]" />
                                        <input type="number" step="0.1" placeholder="ET" value={filters.et} onChange={(e) => setFilter('et', e.target.value ? Number(e.target.value) : '')} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#10AD0B]" />
                                    </div>
                                    </div>
                                </div>
                            ) : null}

                            <div className="grid grid-cols-2 gap-2">
                                <input type="number" placeholder="Рік випуску" value={filters.production_year} onChange={(e) => setFilter('production_year', e.target.value ? Number(e.target.value) : '')} className="w-full rounded-xl border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#10AD0B]" />
                                <CountrySearchSelect
                                    value={filters.country_of_origin}
                                    onChange={(value) => setFilter('country_of_origin', value)}
                                    emptyLabel="Усі країни"
                                    placeholder="Країна виробник"
                                />
                            </div>

                            {isTire ? (
                                <div className="flex flex-col gap-4 mt-2 bg-gray-800/50 p-4 rounded-xl border border-gray-800">
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked={filters.is_run_flat} onChange={(e) => setFilter('is_run_flat', e.target.checked)} className="h-5 w-5 rounded border-gray-600 bg-gray-700 text-[#10AD0B] focus:ring-[#10AD0B]" />
                                        <span className="text-sm font-medium text-gray-200">Run Flat (Посилена боковина)</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked={filters.is_spiked} onChange={(e) => setFilter('is_spiked', e.target.checked)} className="h-5 w-5 rounded border-gray-600 bg-gray-700 text-[#10AD0B] focus:ring-[#10AD0B]" />
                                        <span className="text-sm font-medium text-gray-200">Шиповані</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer">
                                        <input type="checkbox" checked={filters.anti_puncture} onChange={(e) => setFilter('anti_puncture', e.target.checked)} className="h-5 w-5 rounded border-gray-600 bg-gray-700 text-[#10AD0B] focus:ring-[#10AD0B]" />
                                        <span className="text-sm font-medium text-gray-200">Антипрокол (Seal)</span>
                                    </label>
                                </div>
                            ) : null}
                        </>
                    )}
                </div>

                {/* Кнопки */}
                <div className="pt-4 border-t border-gray-800 flex gap-3 mt-auto">
                    <button onClick={() => { resetFilters(); onClose(); }} className="flex-1 py-3.5 bg-gray-800 text-gray-300 rounded-xl font-medium hover:bg-gray-700 hover:text-white transition-colors">
                        Скинути
                    </button>
                    <button onClick={onClose} className="flex-[2] rounded-xl bg-[#10AD0B] py-3.5 font-bold text-white shadow-lg shadow-[#10AD0B]/20 transition-all active:scale-[0.98] hover:bg-[#0d9309]">
                        Застосувати
                    </button>
                </div>
            </div>
        </div>
    );
};
