import { useEffect, useMemo, useRef, useState } from 'react';
import {
  buildCatalogSearchHintChips,
  buildSuggestionSections,
  clearRecentSearches,
  createDefaultSearchSuggestionSectionsConfig,
  getLotPrimaryLabel,
  getLotSearchableText,
  getLotTagLabels,
  loadRecentSearches,
  saveRecentSearch,
  getSearchHighlightTokens,
  SearchSuggestionsDropdown,
  SearchHighlightedText,
} from '@tire-crm/shared';
import { useStaffLotSuggestions, useStaffLots, useTrackStaffLotSuggestionSelection } from '../api/staffLots';
import { useStaffWarehouses } from '../api/staffWarehouses';
import InventoryFiltersDrawer from '../components/InventoryFiltersDrawer';
import LotActionPanel from '../components/LotActionPanel';
import type { LotInternalResponse, StaffLotFilters } from '../types/lot';
import { defaultStaffLotFilters } from '../types/lot';

type InventoryViewProps = {
  onCreateLot?: () => void;
  onOpenDetails?: (lot: LotInternalResponse, warehouseLabel: string) => void;
  onEditLot?: (lot: LotInternalResponse) => void;
  onDeleteLot?: (lot: LotInternalResponse) => void;
  onSellLot?: (lot: LotInternalResponse) => void;
  onBulkDeleteLots?: (lots: LotInternalResponse[]) => void;
  onBulkPrintLots?: (lots: LotInternalResponse[]) => void | Promise<void>;
  isBulkPrinting?: boolean;
  onOpenPriceTag?: (lot: LotInternalResponse) => void;
};

const LOW_STOCK_THRESHOLD = 4;

const statusLabels: Record<string, string> = {
  ACTIVE: 'Активний',
  IN_STOCK: 'На складі',
  RESERVED: 'Зарезервовано',
  SOLD: 'Продано',
  ARCHIVED: 'Архів',
};

const compactStatusLabels: Record<string, string> = {
  ACTIVE: 'Актив.',
  IN_STOCK: 'Склад',
  RESERVED: 'Резерв',
  SOLD: 'Продано',
  ARCHIVED: 'Архів',
};

const formatMoney = (value: number): string => {
  return new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

const getStatusLabel = (status: string): string => {
  return statusLabels[status] ?? status;
};

const getCompactStatusLabel = (status: string): string => {
  return compactStatusLabels[status] ?? getStatusLabel(status);
};

const getStatusClassName = (status: string): string => {
  switch (status) {
    case 'ACTIVE':
    case 'IN_STOCK':
      return 'bg-emerald-500/15 text-emerald-300 border border-emerald-600/40';
    case 'RESERVED':
      return 'bg-amber-500/15 text-amber-300 border border-amber-600/40';
    case 'SOLD':
      return 'bg-slate-500/20 text-slate-300 border border-slate-500/40';
    case 'ARCHIVED':
      return 'bg-zinc-500/20 text-zinc-300 border border-zinc-500/40';
    default:
      return 'bg-blue-500/15 text-blue-300 border border-blue-600/40';
  }
};

const getTypeLabel = (type: string): string => {
  if (type === 'TIRE') return 'Шина';
  if (type === 'RIM') return 'Диск';
  if (type === 'ACCESSORY') return 'Супутній';
  return type;
};

const activeFiltersCount = (filters: StaffLotFilters): number => {
  return [
    filters.type !== '',
    filters.sort_by !== defaultStaffLotFilters.sort_by,
    filters.sort_order !== defaultStaffLotFilters.sort_order,
    filters.season !== '',
    filters.condition !== '',
    filters.width !== '',
    filters.profile !== '',
    filters.diameter !== '',
    filters.pcd.trim() !== '',
    filters.dia !== '',
    filters.et !== '',
    filters.rim_material !== '',
    filters.production_year !== '',
    filters.country_of_origin.trim() !== '',
    filters.is_run_flat,
    filters.is_spiked,
    filters.anti_puncture,
    filters.warehouse_id !== '',
    filters.accessory_category !== '',
    filters.fastener_type !== '',
    filters.thread_size.trim() !== '',
    filters.seat_type.trim() !== '',
    filters.ring_inner_diameter !== '',
    filters.ring_outer_diameter !== '',
    filters.spacer_type !== '',
    filters.spacer_thickness !== '',
    filters.package_quantity !== '',
  ].filter(Boolean).length;
};

const lotMatchesFilters = (lot: LotInternalResponse, search: string, filters: StaffLotFilters): boolean => {
  const fullText = getLotSearchableText(lot);
  if (search && !fullText.includes(search.toLowerCase().trim())) {
    return false;
  }

  if (filters.type && lot.type !== filters.type) {
    return false;
  }
  if (filters.condition && lot.condition !== filters.condition) {
    return false;
  }
  if (filters.warehouse_id && lot.warehouse_id !== filters.warehouse_id) {
    return false;
  }

  if (filters.season && lot.params?.season !== filters.season) {
    return false;
  }
  if (filters.width !== '' && lot.params?.width !== filters.width) {
    return false;
  }
  if (filters.profile !== '' && lot.params?.profile !== filters.profile) {
    return false;
  }
  if (filters.diameter !== '' && lot.params?.diameter !== filters.diameter) {
    return false;
  }
  if (filters.pcd && !(lot.params?.pcd ?? '').toLowerCase().includes(filters.pcd.toLowerCase())) {
    return false;
  }
  if (filters.dia !== '' && lot.params?.dia !== filters.dia) {
    return false;
  }
  if (filters.et !== '' && lot.params?.et !== filters.et) {
    return false;
  }
  if (filters.rim_material && lot.params?.rim_material !== filters.rim_material) {
    return false;
  }
  if (filters.production_year !== '' && lot.params?.production_year !== filters.production_year) {
    return false;
  }
  if (
    filters.country_of_origin &&
    !(lot.params?.country_of_origin ?? '').toLowerCase().includes(filters.country_of_origin.toLowerCase())
  ) {
    return false;
  }

  if (filters.is_run_flat && !lot.params?.is_run_flat) {
    return false;
  }
  if (filters.is_spiked && !lot.params?.is_spiked) {
    return false;
  }
  if (filters.anti_puncture && !lot.params?.anti_puncture) {
    return false;
  }
  if (filters.accessory_category && lot.params?.accessory_category !== filters.accessory_category) {
    return false;
  }
  if (filters.fastener_type && lot.params?.fastener_type !== filters.fastener_type) {
    return false;
  }
  if (filters.thread_size && !(lot.params?.thread_size ?? '').toLowerCase().includes(filters.thread_size.toLowerCase())) {
    return false;
  }
  if (filters.seat_type && !(lot.params?.seat_type ?? '').toLowerCase().includes(filters.seat_type.toLowerCase())) {
    return false;
  }
  if (filters.ring_inner_diameter !== '' && lot.params?.ring_inner_diameter !== filters.ring_inner_diameter) {
    return false;
  }
  if (filters.ring_outer_diameter !== '' && lot.params?.ring_outer_diameter !== filters.ring_outer_diameter) {
    return false;
  }
  if (filters.spacer_type && lot.params?.spacer_type !== filters.spacer_type) {
    return false;
  }
  if (filters.spacer_thickness !== '' && lot.params?.spacer_thickness !== filters.spacer_thickness) {
    return false;
  }
  if (filters.package_quantity !== '' && lot.params?.package_quantity !== filters.package_quantity) {
    return false;
  }

  return true;
};

export default function InventoryView({
  onCreateLot,
  onOpenDetails,
  onEditLot,
  onDeleteLot,
  onSellLot,
  onBulkDeleteLots,
  onBulkPrintLots,
  isBulkPrinting = false,
  onOpenPriceTag,
}: InventoryViewProps) {
  const recentSearchConfig = {
    persistentKey: 'staff-catalog-recent-searches',
    persistentLimit: 6,
    sessionKey: 'staff-catalog-recent-searches-session',
    sessionLimit: 3,
  } as const;
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<StaffLotFilters>(defaultStaffLotFilters);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement | null>(null);
  const searchDropdownRef = useRef<HTMLDivElement | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => loadRecentSearches(recentSearchConfig));
  const isTouchDevice = useMemo(
    () => typeof window !== 'undefined' && (window.matchMedia?.('(pointer: coarse)').matches || navigator.maxTouchPoints > 0),
    [],
  );
  const [debouncedSuggestionSearch, setDebouncedSuggestionSearch] = useState('');

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 350);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSuggestionSearch(searchInput.trim());
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [searchInput]);

  useEffect(() => {
    if (!isSearchDropdownOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      const targetNode = event.target as Node;
      if (
        !searchContainerRef.current?.contains(targetNode) &&
        !searchDropdownRef.current?.contains(targetNode)
      ) {
        setIsSearchDropdownOpen(false);
        setActiveSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isSearchDropdownOpen]);

  const { data: warehouses = [] } = useStaffWarehouses();

  const requestFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch,
    }),
    [debouncedSearch, filters],
  );

  const { data: lots = [], isLoading, isError, isFetching } = useStaffLots({
    page: 1,
    pageSize: 200,
    filters: requestFilters,
  });

  const warehouseMap = useMemo(() => {
    return new Map(warehouses.map((warehouse) => [warehouse.id, warehouse]));
  }, [warehouses]);

  const filteredLots = useMemo(() => {
    return lots
      .filter((lot) => lotMatchesFilters(lot, debouncedSearch, filters))
      .filter((lot) => (lowStockOnly ? lot.current_quantity <= LOW_STOCK_THRESHOLD : true));
  }, [debouncedSearch, filters, lots, lowStockOnly]);
  const searchHintChips = useMemo(() => buildCatalogSearchHintChips(searchInput), [searchInput]);
  const suggestionSectionsConfig = useMemo(
    () => createDefaultSearchSuggestionSectionsConfig(!searchInput.trim()),
    [searchInput],
  );
  const { data: searchSuggestions = [], isFetching: isSuggestionsLoading } = useStaffLotSuggestions(
    {
      ...filters,
      search: debouncedSuggestionSearch.trim(),
    },
    8,
  );
  const trackSuggestionSelection = useTrackStaffLotSuggestionSelection();
  const quickSearchSuggestions = useMemo(
    () => (!searchInput.trim() ? searchSuggestions.slice(0, 6) : []),
    [searchInput, searchSuggestions],
  );
  const autocompleteSuggestions = useMemo(
    () => (searchInput.trim() ? searchSuggestions : []),
    [searchInput, searchSuggestions],
  );
  const highlightTokens = useMemo(() => getSearchHighlightTokens(searchInput), [searchInput]);
  const suggestionSections = useMemo(
    () =>
      buildSuggestionSections(
        searchInput.trim() ? autocompleteSuggestions : quickSearchSuggestions,
        recentSearches,
        suggestionSectionsConfig,
      ),
    [autocompleteSuggestions, quickSearchSuggestions, recentSearches, suggestionSectionsConfig],
  );
  const dropdownSuggestionItems = useMemo(
    () => suggestionSections.flatMap((section) => section.items),
    [suggestionSections],
  );

  useEffect(() => {
    setActiveSuggestionIndex(-1);
  }, [dropdownSuggestionItems]);

  const selectedLots = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    return filteredLots.filter((lot) => selectedSet.has(lot.id));
  }, [filteredLots, selectedIds]);

  const printableSelectedLots = useMemo(() => selectedLots.filter((lot) => lot.current_quantity > 0), [selectedLots]);

  const lowStockCount = useMemo(() => lots.filter((lot) => lot.current_quantity <= LOW_STOCK_THRESHOLD).length, [lots]);

  const getWarehouseLabel = (warehouseId: string) => {
    const warehouse = warehouseMap.get(warehouseId);
    if (!warehouse) {
      return warehouseId;
    }
    return `${warehouse.name} (${warehouse.location})`;
  };

  const setFilter = <K extends keyof StaffLotFilters>(key: K, value: StaffLotFilters[K]) => {
    setFilters((prev: StaffLotFilters) => ({ ...prev, [key]: value }));
  };

  const toggleSelected = (lotId: string) => {
    setSelectedIds((prev) => (prev.includes(lotId) ? prev.filter((id) => id !== lotId) : [...prev, lotId]));
  };

  const toggleSelectionMode = () => {
    setSelectionMode((prev) => {
      if (prev) {
        setSelectedIds([]);
      }
      return !prev;
    });
  };

  const applySearchSuggestion = (value: string) => {
    setRecentSearches(saveRecentSearch(recentSearchConfig, value));
    trackSuggestionSelection.mutate(value);
    setSearchInput(value);
    setIsSearchDropdownOpen(false);
    setActiveSuggestionIndex(-1);
  };

  return (
    <section className="p-4 space-y-4 text-white">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Список товарів</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className="relative rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-100 transition hover:bg-gray-700"
          >
            Фільтри
            {activeFiltersCount(filters) > 0 ? (
              <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-xs text-white">
                {activeFiltersCount(filters)}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={toggleSelectionMode}
            className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
              selectionMode
                ? 'border-[#10AD0B]/40 bg-[#10AD0B]/15 text-[#8ff38b]'
                : 'border-gray-700 bg-gray-800 text-gray-100 hover:bg-gray-700'
            }`}
          >
            {selectionMode ? 'Скасувати вибір' : 'Масові дії'}
          </button>
          <button
            type="button"
            onClick={onCreateLot}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Додати товар
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="rounded-full border border-gray-800 bg-gray-900 px-3 py-1 text-xs text-gray-300">
          Видимих позицій: <span className="font-semibold text-white">{filteredLots.length}</span>
        </div>
        <button
          type="button"
          onClick={() => setLowStockOnly((prev) => !prev)}
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
            lowStockOnly
              ? 'border-amber-500/30 bg-amber-500/15 text-amber-200'
              : 'border-gray-800 bg-gray-900 text-gray-300 hover:bg-gray-800'
          }`}
        >
          Низький залишок: {lowStockCount}
        </button>
        {selectionMode ? (
          <div className="rounded-full border border-[#10AD0B]/25 bg-[#10AD0B]/10 px-3 py-1 text-xs text-[#8ff38b]">
            Вибрано: <span className="font-semibold text-white">{selectedIds.length}</span>
          </div>
        ) : null}
      </div>

      {selectionMode ? (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-800 bg-gray-900 p-3">
          <button
            type="button"
            onClick={() => setSelectedIds(filteredLots.filter((lot) => lot.current_quantity > 0).map((lot) => lot.id))}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-medium text-gray-100 transition hover:bg-gray-700"
          >
            Вибрати всі в наявності
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-medium text-gray-100 transition hover:bg-gray-700"
          >
            Очистити вибір
          </button>
          <button
            type="button"
            disabled={printableSelectedLots.length === 0 || isBulkPrinting}
            onClick={() => void onBulkPrintLots?.(printableSelectedLots)}
            className="rounded-lg border border-blue-700/70 bg-blue-900/30 px-3 py-2 text-sm font-medium text-blue-200 transition hover:bg-blue-900/45 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isBulkPrinting ? 'Підготовка цінників...' : 'Друк цінників'}
          </button>
          <button
            type="button"
            disabled={selectedLots.length === 0}
            onClick={() => onBulkDeleteLots?.(selectedLots)}
            className="rounded-lg border border-red-700/70 bg-red-900/25 px-3 py-2 text-sm font-medium text-red-200 transition hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Видалити вибрані
          </button>
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="inventory-search" className="text-sm text-gray-300">
          Пошук за розміром, брендом, роком, станом або ID
        </label>
        <div ref={searchContainerRef} className="relative z-30">
          <input
            id="inventory-search"
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onFocus={() => {
              if (dropdownSuggestionItems.length > 0) {
                setIsSearchDropdownOpen(true);
              }
            }}
            onKeyDown={(event) => {
              if (isTouchDevice) {
                return;
              }
              const suggestions = dropdownSuggestionItems;
              if (suggestions.length === 0) {
                return;
              }

              if (event.key === 'ArrowDown') {
                event.preventDefault();
                setIsSearchDropdownOpen(true);
                setActiveSuggestionIndex((prev) => (prev + 1) % suggestions.length);
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                setIsSearchDropdownOpen(true);
                setActiveSuggestionIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
              } else if (event.key === 'Enter') {
                if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
                  event.preventDefault();
                  applySearchSuggestion(suggestions[activeSuggestionIndex]);
                }
              } else if (event.key === 'Escape') {
                setIsSearchDropdownOpen(false);
                setActiveSuggestionIndex(-1);
              }
            }}
            placeholder="Наприклад: 225/45 R17, Michelin, 2024, Новий"
            className="w-full rounded-xl border border-gray-700 bg-gray-900 px-4 py-2.5 text-white outline-none transition focus:border-blue-500"
          />
          <SearchSuggestionsDropdown
            anchorRef={searchContainerRef}
            dropdownRef={searchDropdownRef}
            isOpen={isSearchDropdownOpen}
            isLoading={isSuggestionsLoading}
            sections={suggestionSections}
            activeSuggestionIndex={activeSuggestionIndex}
            highlightTokens={highlightTokens}
            isTouchDevice={isTouchDevice}
            query={searchInput}
            onSelect={applySearchSuggestion}
            onHoverIndexChange={setActiveSuggestionIndex}
            onClearRecent={() => setRecentSearches(clearRecentSearches(recentSearchConfig))}
          />
        </div>
        {searchHintChips.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {searchHintChips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[11px] font-medium text-blue-200"
              >
                {chip}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-gray-800 bg-gray-900 px-4 py-3 text-sm text-gray-300">
        Сортування: <span className="font-semibold text-white">
          {filters.sort_by === 'price'
            ? filters.sort_order === 'asc'
              ? 'Ціна: від дешевих'
              : 'Ціна: від дорогих'
            : filters.sort_by === 'stock'
              ? 'Спочатку в наявності'
              : filters.sort_by === 'popularity'
                ? 'За популярністю'
                : 'За новизною'}
        </span>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-400">
          Завантаження товарів...
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-xl border border-red-800/60 bg-red-950/30 p-4 text-sm text-red-300">
          Не вдалося завантажити список товарів.
        </div>
      ) : null}

      {!isLoading && !isError && filteredLots.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-400">
          Товари не знайдено.
        </div>
      ) : null}

      <div className="space-y-3">
        {filteredLots.map((lot) => {
          const primaryLabel = getLotPrimaryLabel(lot) || [lot.brand, lot.model].filter(Boolean).join(' ');
          const tags = getLotTagLabels(lot);

          return (
          <article
            key={lot.id}
            onClick={() => onOpenDetails?.(lot, getWarehouseLabel(lot.warehouse_id))}
            className={`cursor-pointer rounded-2xl border bg-gray-900 p-3 shadow-sm transition hover:border-gray-700 ${
              lot.current_quantity <= LOW_STOCK_THRESHOLD ? 'border-amber-700/40' : 'border-gray-800'
            }`}
          >
            <div className="flex items-start gap-3">
              {selectionMode ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    toggleSelected(lot.id);
                  }}
                  className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[11px] font-bold transition ${
                    selectedIds.includes(lot.id)
                      ? 'border-[#10AD0B] bg-[#10AD0B] text-black'
                      : 'border-gray-600 bg-gray-950 text-transparent'
                  }`}
                >
                  ✓
                </button>
              ) : null}
              <div className="flex w-20 shrink-0 flex-col gap-2">
                {lot.photos?.[0] ? (
                  <img
                    src={lot.photos[0]}
                    alt={`${lot.brand} ${lot.model ?? ''}`}
                    className="h-20 w-20 rounded-xl border border-gray-800 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-dashed border-gray-700 bg-gray-950 px-1 text-center text-[10px] text-gray-500">
                    Немає фото
                  </div>
                )}

                <div className="grid grid-cols-1 gap-1 text-[11px] leading-4 text-gray-300">
                  <p className="rounded-md bg-gray-950 px-2 py-1">
                    Кіл-ть: <span className="font-semibold text-white">{lot.current_quantity}</span>
                  </p>
                  {lot.current_quantity <= LOW_STOCK_THRESHOLD ? (
                    <p className="rounded-md bg-amber-500/15 px-2 py-1 text-amber-200">
                      Низький залишок
                    </p>
                  ) : null}
                  <p className="rounded-md bg-gray-950 px-2 py-1">
                    {getTypeLabel(lot.type)}
                  </p>
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="grid grid-cols-[1fr_72px] items-start gap-x-2 gap-y-2">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold leading-5 text-white">
                      <SearchHighlightedText text={primaryLabel} tokens={highlightTokens} />
                    </h3>
                    <p className="mt-0.5 break-words text-[11px] leading-4 text-gray-400">Склад: {getWarehouseLabel(lot.warehouse_id)}</p>
                  </div>

                  <div className="flex w-[72px] shrink-0 flex-col items-end gap-1 text-right">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getStatusClassName(lot.status)}`}
                    >
                      {getCompactStatusLabel(lot.status)}
                    </span>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-gray-500">Продаж</p>
                      <p className="text-base font-bold leading-5 text-white">{formatMoney(lot.sell_price)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide text-gray-500">Закуп</p>
                      <p className="text-xs font-semibold leading-4 text-gray-300">{formatMoney(lot.purchase_price)}</p>
                    </div>
                  </div>

                  <div className="col-span-2 flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <span key={tag} className="rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-[11px] text-gray-200">
                        <SearchHighlightedText text={tag} tokens={highlightTokens} />
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <LotActionPanel
                lot={lot}
                compact
                onEdit={onEditLot}
                onDelete={onDeleteLot}
                onSell={onSellLot}
                onOpenPriceTag={onOpenPriceTag}
              />
            </div>
          </article>
          );
        })}
      </div>

      {isFetching && !isLoading ? <p className="text-xs text-gray-500">Оновлення списку...</p> : null}

      <InventoryFiltersDrawer
        isOpen={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        filters={filters}
        onSetFilter={setFilter}
        onReset={() => setFilters(defaultStaffLotFilters)}
        warehouses={warehouses}
      />
    </section>
  );
}
