// apps/client-tma/src/store/useFilterStore.ts
import { create } from 'zustand';

export interface LotFilters {
    search: string;
    type: string;
    season: string;
    condition: string;
    width: number | '';
    profile: number | '';
    diameter: number | '';
    pcd: string;
    dia: number | '';
    et: number | '';
    rim_material: string;
    production_year: number | '';
    country_of_origin: string;
    is_run_flat: boolean;
    is_spiked: boolean;
    anti_puncture: boolean;
    accessory_category: string;
    fastener_type: string;
    thread_size: string;
    seat_type: string;
    ring_inner_diameter: number | '';
    ring_outer_diameter: number | '';
    spacer_type: string;
    spacer_thickness: number | '';
    package_quantity: number | '';
}

interface FilterState {
    filters: LotFilters;
    setFilter: (key: keyof LotFilters, value: any) => void;
    setTypeFilter: (type: LotFilters['type']) => void;
    resetFilters: () => void;
}

const defaultFilters: LotFilters = {
    search: '',
    type: '',
    season: '',
    condition: '',
    width: '',
    profile: '',
    diameter: '',
    pcd: '',
    dia: '',
    et: '',
    rim_material: '',
    production_year: '',
    country_of_origin: '',
    is_run_flat: false,
    is_spiked: false,
    anti_puncture: false,
    accessory_category: '',
    fastener_type: '',
    thread_size: '',
    seat_type: '',
    ring_inner_diameter: '',
    ring_outer_diameter: '',
    spacer_type: '',
    spacer_thickness: '',
    package_quantity: '',
};

const buildFiltersForType = (prev: LotFilters, type: LotFilters['type']): LotFilters => {
    const nextFilters: LotFilters = {
        ...defaultFilters,
        search: prev.search,
        type,
    };

    if (type === 'TIRE') {
        return nextFilters;
    }

    if (type === 'RIM') {
        return nextFilters;
    }

    if (type === 'ACCESSORY') {
        return nextFilters;
    }

    return nextFilters;
};

export const useFilterStore = create<FilterState>((set) => ({
    filters: defaultFilters,
    setFilter: (key, value) =>
        set((state) => {
            if (key === 'type') {
                return { filters: buildFiltersForType(state.filters, value as LotFilters['type']) };
            }

            return { filters: { ...state.filters, [key]: value } };
        }),
    setTypeFilter: (type) =>
        set((state) => ({
            filters: buildFiltersForType(state.filters, type),
        })),
    resetFilters: () => set({ filters: defaultFilters }),
}));
