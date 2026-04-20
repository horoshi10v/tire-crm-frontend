import type { LotInternalResponse, LotParams, LotType } from '../../types/lot';
import type { LotCondition, LotFormState, UploadPhotoResponse } from './types';

export const extractPhotoUrl = (payload: UploadPhotoResponse): string => {
  const prioritizedKeys = ['url', 'photo_url', 'photoUrl', 'public_url', 'publicUrl'];
  for (const key of prioritizedKeys) {
    const value = payload[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  const firstString = Object.values(payload).find((value) => typeof value === 'string' && value.length > 0);
  if (!firstString) {
    throw new Error('Сервер не повернув URL фото');
  }
  return firstString;
};

const normalizeCondition = (value: string | undefined): LotCondition => {
  return value === 'USED' ? 'USED' : 'NEW';
};

const normalizeType = (value: string | undefined): LotType => {
  if (value === 'RIM' || value === 'ACCESSORY') {
    return value;
  }
  return 'TIRE';
};

const normalizeSeason = (value: string | undefined): LotFormState['params']['season'] => {
  if (value === 'SUMMER' || value === 'WINTER' || value === 'ALL_SEASON') {
    return value;
  }
  return '';
};

const normalizeAccessoryCategory = (value: string | undefined): LotFormState['params']['accessory_category'] => {
  if (value === 'FASTENERS' || value === 'HUB_RINGS' || value === 'SPACERS' || value === 'TIRE_BAGS') {
    return value;
  }
  return '';
};

const normalizeFastenerType = (value: string | undefined): LotFormState['params']['fastener_type'] => {
  if (value === 'NUT' || value === 'BOLT') {
    return value;
  }
  return '';
};

const normalizeSpacerType = (value: string | undefined): LotFormState['params']['spacer_type'] => {
  if (value === 'ADAPTER' || value === 'EXTENDER') {
    return value;
  }
  return '';
};

const normalizeRimMaterial = (value: string | undefined): LotFormState['params']['rim_material'] => {
  if (value === 'STEEL' || value === 'ALLOY') {
    return value;
  }
  return '';
};

const normalizeTireTerrain = (value: string | undefined): LotFormState['params']['tire_terrain'] => {
  if (value === 'AT' || value === 'MT') {
    return value;
  }
  return '';
};

const toInputNumber = (value: number | undefined): string => {
  if (value === undefined || Number.isNaN(value)) {
    return '';
  }
  return String(value);
};

export const createInitialState = (lot: LotInternalResponse | null): LotFormState => ({
  brand: lot?.brand ?? '',
  model: lot?.model ?? '',
  condition: normalizeCondition(lot?.condition),
  type: normalizeType(lot?.type),
  initialQuantity: toInputNumber(lot?.initial_quantity),
  purchasePrice: toInputNumber(lot?.purchase_price),
  sellPrice: toInputNumber(lot?.sell_price),
  defects: lot?.defects ?? '',
  warehouseId: lot?.warehouse_id ?? '',
  photos: lot?.photos ?? [],
  params: {
    width: toInputNumber(lot?.params?.width),
    profile: toInputNumber(lot?.params?.profile),
    diameter: toInputNumber(lot?.params?.diameter),
    pcd: lot?.params?.pcd ?? '',
    dia: toInputNumber(lot?.params?.dia),
    et: toInputNumber(lot?.params?.et),
    rim_material: normalizeRimMaterial(lot?.params?.rim_material),
    production_year: toInputNumber(lot?.params?.production_year),
    country_of_origin: lot?.params?.country_of_origin ?? '',
    season: normalizeSeason(lot?.params?.season),
    is_run_flat: Boolean(lot?.params?.is_run_flat),
    is_spiked: Boolean(lot?.params?.is_spiked),
    is_c_type: Boolean(lot?.params?.is_c_type),
    tire_terrain: normalizeTireTerrain(lot?.params?.tire_terrain),
    anti_puncture: Boolean(lot?.params?.anti_puncture),
    accessory_category: normalizeAccessoryCategory(lot?.params?.accessory_category),
    fastener_type: normalizeFastenerType(lot?.params?.fastener_type),
    thread_size: lot?.params?.thread_size ?? '',
    seat_type: lot?.params?.seat_type ?? '',
    ring_inner_diameter: toInputNumber(lot?.params?.ring_inner_diameter),
    ring_outer_diameter: toInputNumber(lot?.params?.ring_outer_diameter),
    spacer_type: normalizeSpacerType(lot?.params?.spacer_type),
    spacer_thickness: toInputNumber(lot?.params?.spacer_thickness),
    package_quantity: toInputNumber(lot?.params?.package_quantity),
  },
});

export const hasMeaningfulParams = (params: LotFormState['params']): boolean => {
  return Boolean(
    params.width.trim() ||
      params.profile.trim() ||
      params.diameter.trim() ||
      params.pcd.trim() ||
      params.dia.trim() ||
      params.et.trim() ||
      params.rim_material ||
      params.production_year.trim() ||
      params.country_of_origin.trim() ||
      params.season ||
      params.is_run_flat ||
      params.is_spiked ||
      params.is_c_type ||
      params.tire_terrain ||
      params.anti_puncture ||
      params.accessory_category ||
      params.fastener_type ||
      params.thread_size.trim() ||
      params.seat_type.trim() ||
      params.ring_inner_diameter.trim() ||
      params.ring_outer_diameter.trim() ||
      params.spacer_type ||
      params.spacer_thickness.trim() ||
      params.package_quantity.trim(),
  );
};

export const hasInitialParams = (lot: LotInternalResponse | null): boolean => {
  if (!lot?.params) {
    return false;
  }
  return Object.keys(lot.params).length > 0;
};

export const toDecimal = (value: string): number => Number(value.replace(',', '.'));
export const toInteger = (value: string): number => Number.parseInt(value, 10);

export const buildParamsPayload = (params: LotFormState['params']): LotParams => {
  const payload: LotParams = {
    anti_puncture: params.anti_puncture,
    is_run_flat: params.is_run_flat,
    is_spiked: params.is_spiked,
    is_c_type: params.is_c_type,
  };

  if (params.width.trim()) payload.width = toDecimal(params.width);
  if (params.profile.trim()) payload.profile = toDecimal(params.profile);
  if (params.diameter.trim()) payload.diameter = toDecimal(params.diameter);
  if (params.pcd.trim()) payload.pcd = params.pcd.trim();
  if (params.dia.trim()) payload.dia = toDecimal(params.dia);
  if (params.et.trim()) payload.et = toDecimal(params.et);
  if (params.rim_material) payload.rim_material = params.rim_material;
  if (params.production_year.trim()) payload.production_year = toInteger(params.production_year);
  if (params.country_of_origin.trim()) payload.country_of_origin = params.country_of_origin.trim();
  if (params.season) payload.season = params.season;
  if (params.tire_terrain) payload.tire_terrain = params.tire_terrain;
  if (params.accessory_category) payload.accessory_category = params.accessory_category;
  if (params.fastener_type) payload.fastener_type = params.fastener_type;
  if (params.thread_size.trim()) payload.thread_size = params.thread_size.trim();
  if (params.seat_type.trim()) payload.seat_type = params.seat_type.trim();
  if (params.ring_inner_diameter.trim()) payload.ring_inner_diameter = toDecimal(params.ring_inner_diameter);
  if (params.ring_outer_diameter.trim()) payload.ring_outer_diameter = toDecimal(params.ring_outer_diameter);
  if (params.spacer_type) payload.spacer_type = params.spacer_type;
  if (params.spacer_thickness.trim()) payload.spacer_thickness = toDecimal(params.spacer_thickness);
  if (params.package_quantity.trim()) payload.package_quantity = toInteger(params.package_quantity);

  return payload;
};
