// apps/staff-tma/src/types/lot.ts

export type LotCondition = 'NEW' | 'USED';
export type LotType = 'TIRE' | 'RIM' | 'ACCESSORY';
export type LotSeason = 'SUMMER' | 'WINTER' | 'ALL_SEASON';
export type LotSortBy = 'price' | 'created_at' | 'stock' | 'popularity';
export type LotSortOrder = 'asc' | 'desc';
export type AccessoryCategory = 'FASTENERS' | 'HUB_RINGS' | 'SPACERS' | 'TIRE_BAGS';
export type FastenerType = 'NUT' | 'BOLT';
export type SpacerType = 'ADAPTER' | 'EXTENDER';
export type RimMaterial = 'STEEL' | 'ALLOY';
export type TireTerrain = 'AT' | 'MT';

export interface LotParams {
    anti_puncture?: boolean;
    accessory_category?: AccessoryCategory;
    country_of_origin?: string;
    dia?: number;
    diameter?: number;
    et?: number;
    fastener_type?: FastenerType;
    is_run_flat?: boolean;
    is_spiked?: boolean;
    is_c_type?: boolean;
    package_quantity?: number;
    pcd?: string;
    profile?: number;
    production_year?: number;
    rim_material?: RimMaterial;
    ring_inner_diameter?: number;
    ring_outer_diameter?: number;
    seat_type?: string;
    season?: LotSeason;
    spacer_thickness?: number;
    spacer_type?: SpacerType;
    thread_size?: string;
    tire_terrain?: TireTerrain;
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
    sort_by: LotSortBy;
    sort_order: LotSortOrder;
    season: '' | LotSeason;
    condition: '' | LotCondition;
    width: number | '';
    profile: number | '';
    diameter: number | '';
    pcd: string;
    dia: number | '';
    et: number | '';
    rim_material: '' | RimMaterial;
    production_year: number | '';
    country_of_origin: string;
    is_run_flat: boolean;
    is_spiked: boolean;
    is_c_type: boolean;
    tire_terrain: '' | TireTerrain;
    anti_puncture: boolean;
    warehouse_id: string;
    accessory_category: '' | AccessoryCategory;
    fastener_type: '' | FastenerType;
    thread_size: string;
    seat_type: string;
    ring_inner_diameter: number | '';
    ring_outer_diameter: number | '';
    spacer_type: '' | SpacerType;
    spacer_thickness: number | '';
    package_quantity: number | '';
}

export const defaultStaffLotFilters: StaffLotFilters = {
    search: '',
    type: '',
    sort_by: 'created_at',
    sort_order: 'desc',
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
    warehouse_id: '',
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
