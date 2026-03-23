// apps/client-tma/src/types/lot.ts

export type LotType = 'TIRE' | 'RIM' | 'ACCESSORY';
export type LotCondition = 'NEW' | 'USED';
export type LotSeason = 'SUMMER' | 'WINTER' | 'ALL_SEASON';
export type AccessoryCategory = 'FASTENERS' | 'HUB_RINGS' | 'SPACERS' | 'TIRE_BAGS';
export type FastenerType = 'NUT' | 'BOLT';
export type SpacerType = 'ADAPTER' | 'EXTENDER';

export interface LotParams {
    anti_puncture?: boolean;
    accessory_category?: AccessoryCategory;
    diameter?: number;
    fastener_type?: FastenerType;
    is_run_flat?: boolean;
    is_spiked?: boolean;
    package_quantity?: number;
    profile?: number;
    ring_inner_diameter?: number;
    ring_outer_diameter?: number;
    seat_type?: string;
    season?: string; // SUMMER, WINTER, ALL_SEASON
    spacer_thickness?: number;
    spacer_type?: SpacerType;
    thread_size?: string;
    width?: number;
}

export interface LotPublicResponse {
    id: string;
    brand: string;
    model: string;
    condition: LotCondition;
    type: LotType;
    current_quantity: number;
    sell_price: number;
    defects?: string;
    photos?: string[];
    params?: LotParams;
}
