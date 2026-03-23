// apps/client-tma/src/types/lot.ts

export interface LotParams {
    anti_puncture?: boolean;
    diameter?: number;
    is_run_flat?: boolean;
    is_spiked?: boolean;
    profile?: number;
    season?: string; // SUMMER, WINTER, ALL_SEASON
    width?: number;
}

export interface LotPublicResponse {
    id: string;
    brand: string;
    model: string;
    condition: string;
    type: string;
    current_quantity: number;
    sell_price: number;
    defects?: string;
    photos?: string[];
    params?: LotParams;
}