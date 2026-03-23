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
    is_run_flat: boolean;
    is_spiked: boolean;
    anti_puncture: boolean;
}

interface FilterState {
    filters: LotFilters;
    setFilter: (key: keyof LotFilters, value: any) => void;
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
    is_run_flat: false,
    is_spiked: false,
    anti_puncture: false,
};

export const useFilterStore = create<FilterState>((set) => ({
    filters: defaultFilters,
    setFilter: (key, value) =>
        set((state) => ({ filters: { ...state.filters, [key]: value } })),
    resetFilters: () => set({ filters: defaultFilters }),
}));