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
    is_c_type: boolean;
    tire_terrain: string;
    anti_puncture: boolean;
    accessory_category: string;
    fastener_type: string;
    thread_size: string;
    thread_pitch: string;
    fastener_length: string;
    seat_type: string;
    fastener_color: string;
    wrench_size: string;
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
    is_c_type: false,
    tire_terrain: '',
    anti_puncture: false,
    accessory_category: '',
    fastener_type: '',
    thread_size: '',
    thread_pitch: '',
    fastener_length: '',
    seat_type: '',
    fastener_color: '',
    wrench_size: '',
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
