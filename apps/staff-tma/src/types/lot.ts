// apps/staff-tma/src/types/lot.ts

export type LotCondition = 'NEW' | 'USED';
export type LotType = 'TIRE' | 'RIM';
export type LotSeason = 'SUMMER' | 'WINTER' | 'ALL_SEASON';

export interface LotParams {
    anti_puncture?: boolean;
    diameter?: number;
    is_run_flat?: boolean;
    is_spiked?: boolean;
    profile?: number;
    season?: LotSeason;
    width?: number;
}

// Расширенная модель для персонала (включает себестоимость и склад)
export interface LotInternalResponse {
    id: string;
    brand: string;
    model: string;
    condition: LotCondition;
    type: LotType;
    current_quantity: number;
    initial_quantity: number;
    purchase_price: number;
    sell_price: number;
    defects?: string;
    photos?: string[];
    params?: LotParams;
    status: string;
    warehouse_id: string;
}

// DTO для создания
export interface CreateLotDTO {
    brand: string;
    model?: string;
    condition: LotCondition;
    type: LotType;
    initial_quantity: number;
    purchase_price: number;
    sell_price: number;
    defects?: string;
    photos?: string[];
    params?: LotParams;
    warehouse_id: string;
}

// DTO для обновления
export type UpdateLotDTO = Partial<CreateLotDTO>;

export interface StaffLotFilters {
    search: string;
    type: '' | LotType;
    season: '' | LotSeason;
    condition: '' | LotCondition;
    width: number | '';
    profile: number | '';
    diameter: number | '';
    is_run_flat: boolean;
    is_spiked: boolean;
    anti_puncture: boolean;
    warehouse_id: string;
}

export const defaultStaffLotFilters: StaffLotFilters = {
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
    warehouse_id: '',
};
