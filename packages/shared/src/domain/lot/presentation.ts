export type LotType = 'TIRE' | 'RIM' | 'ACCESSORY';
export type LotCondition = 'NEW' | 'USED';
export type LotInventoryStatus = 'ACTIVE' | 'IN_STOCK' | 'RESERVED' | 'SOLD' | 'ARCHIVED';

export type LotParams = {
  accessory_category?: 'FASTENERS' | 'HUB_RINGS' | 'SPACERS' | 'TIRE_BAGS';
  anti_puncture?: boolean;
  country_of_origin?: string;
  dia?: number;
  diameter?: number;
  et?: number;
  fastener_type?: 'NUT' | 'BOLT';
  is_run_flat?: boolean;
  is_spiked?: boolean;
  is_c_type?: boolean;
  package_quantity?: number;
  pcd?: string;
  profile?: number;
  production_year?: number;
  rim_material?: 'STEEL' | 'ALLOY';
  ring_inner_diameter?: number;
  ring_outer_diameter?: number;
  seat_type?: string;
  season?: 'SUMMER' | 'WINTER' | 'ALL_SEASON' | string;
  spacer_thickness?: number;
  spacer_type?: 'ADAPTER' | 'EXTENDER';
  thread_size?: string;
  tire_terrain?: 'AT' | 'MT' | string;
  width?: number;
};

export type LotLike = {
  id?: string;
  brand?: string;
  model?: string;
  condition?: LotCondition | string;
  type?: LotType | string;
  params?: LotParams;
};

export const lotSeasonLabels: Record<string, string> = {
  SUMMER: 'Літо',
  WINTER: 'Зима',
  ALL_SEASON: 'Всесезон',
};

export const lotConditionLabels: Record<string, string> = {
  NEW: 'Новий',
  USED: 'Вживаний',
};

export const lotAccessoryCategoryLabels: Record<string, string> = {
  FASTENERS: 'Кріплення',
  HUB_RINGS: 'Проставочні кільця',
  SPACERS: 'Проставки',
  TIRE_BAGS: 'Пакети для шин',
};

export const lotFastenerTypeLabels: Record<string, string> = {
  NUT: 'Гайки',
  BOLT: 'Болти',
};

export const lotSpacerTypeLabels: Record<string, string> = {
  ADAPTER: 'Адаптер',
  EXTENDER: 'Розширювач',
};

export const lotRimMaterialLabels: Record<string, string> = {
  STEEL: 'Металеві',
  ALLOY: 'Легкосплавні',
};

export const lotTireTerrainLabels: Record<string, string> = {
  AT: 'A/T',
  MT: 'M/T',
};

export const lotTypeLabels: Record<string, string> = {
  TIRE: 'Шини',
  RIM: 'Диски',
  ACCESSORY: 'Супутні товари',
};

export const lotTypeSingularLabels: Record<string, string> = {
  TIRE: 'Шина',
  RIM: 'Диск',
  ACCESSORY: 'Супутній товар',
};

export const lotInventoryStatusLabels: Record<string, string> = {
  ACTIVE: 'Активний',
  IN_STOCK: 'На складі',
  RESERVED: 'Зарезервовано',
  SOLD: 'Продано',
  ARCHIVED: 'Архів',
};

export const lotInventoryCompactStatusLabels: Record<string, string> = {
  ACTIVE: 'Актив.',
  IN_STOCK: 'Склад',
  RESERVED: 'Резерв',
  SOLD: 'Продано',
  ARCHIVED: 'Архів',
};

const unique = (items: string[]) => [...new Set(items.filter(Boolean))];

export const getLotSizeLabel = (lot: LotLike): string => {
  const params = lot.params;

  if (params?.width && params.profile && params.diameter) {
    return `${params.width}/${params.profile} R${params.diameter}`;
  }

  if (lot.type === 'RIM' && params?.diameter) {
    return `R${params.diameter}`;
  }

  if (params?.ring_inner_diameter && params.ring_outer_diameter) {
    return `${params.ring_inner_diameter}/${params.ring_outer_diameter} мм`;
  }

  if (params?.thread_size) {
    return params.thread_size;
  }

  return '';
};

export const getLotTypeLabel = (type?: string): string => {
  if (!type) {
    return '';
  }

  return lotTypeSingularLabels[type] ?? type;
};

export const getLotConditionLabel = (condition?: string): string => {
  if (!condition) {
    return '';
  }

  return lotConditionLabels[condition] ?? condition;
};

export const getLotSeasonLabel = (season?: string): string => {
  if (!season) {
    return '';
  }

  return lotSeasonLabels[season] ?? season;
};

export const getLotInventoryStatusLabel = (status?: string): string => {
  if (!status) {
    return '';
  }

  return lotInventoryStatusLabels[status] ?? status;
};

export const getLotInventoryCompactStatusLabel = (status?: string): string => {
  if (!status) {
    return '';
  }

  return lotInventoryCompactStatusLabels[status] ?? getLotInventoryStatusLabel(status);
};

export const getLotInventoryStatusTone = (
  status?: string,
): 'neutral' | 'info' | 'success' | 'warning' => {
  switch (status) {
    case 'ACTIVE':
    case 'IN_STOCK':
      return 'success';
    case 'RESERVED':
      return 'warning';
    case 'SOLD':
    case 'ARCHIVED':
      return 'neutral';
    default:
      return 'info';
  }
};

export const getLotLabel = (lot?: Pick<LotLike, 'brand' | 'model'>): string => {
  if (!lot) {
    return 'Лот';
  }
  const model = lot.model?.trim();
  return model ? `${lot.brand ?? ''} ${model}`.trim() : lot.brand?.trim() ?? 'Лот';
};

export const getLotPrimaryLabel = (lot: LotLike): string => {
  if (lot.type === 'RIM') {
    const parts = [
      lot.params?.width ? `${lot.params.width}J` : '',
      lot.params?.diameter ? `R${lot.params.diameter}` : '',
      lot.params?.pcd ? `PCD ${lot.params.pcd}` : '',
      lot.params?.et !== undefined ? `ET ${lot.params.et}` : '',
      lot.brand?.trim(),
      lot.model?.trim(),
      lot.params?.production_year ? String(lot.params.production_year) : '',
    ];

    return parts.filter(Boolean).join(' · ');
  }

  const parts = [
    getLotSizeLabel(lot),
    lot.brand?.trim(),
    lot.model?.trim(),
    lot.params?.production_year ? String(lot.params.production_year) : '',
  ];

  return parts.filter(Boolean).join(' · ');
};

export const getLotTagLabels = (lot: LotLike): string[] => {
  const params = lot.params;
  const tags: string[] = [];
  const rimMaterialLabel = params?.rim_material ? lotRimMaterialLabels[params.rim_material] ?? params.rim_material : '';

  if (lot.condition) {
    tags.push(lotConditionLabels[lot.condition] ?? lot.condition);
  }
  if (params?.season) {
    tags.push(lotSeasonLabels[params.season] ?? params.season);
  }
  if (lot.type === 'RIM' && rimMaterialLabel) {
    tags.push(rimMaterialLabel);
  }
  if (params?.country_of_origin) {
    tags.push(params.country_of_origin);
  }
  if (lot.type === 'RIM' && params?.dia !== undefined) {
    tags.push(`DIA ${params.dia}`);
  }
  if (lot.type) {
    tags.push(lotTypeLabels[lot.type] ?? lot.type);
  }
  if (params?.accessory_category) {
    tags.push(lotAccessoryCategoryLabels[params.accessory_category] ?? params.accessory_category);
  }
  if (params?.fastener_type) {
    tags.push(lotFastenerTypeLabels[params.fastener_type] ?? params.fastener_type);
  }
  if (params?.spacer_type) {
    tags.push(lotSpacerTypeLabels[params.spacer_type] ?? params.spacer_type);
  }
  if (params?.seat_type) {
    tags.push(params.seat_type);
  }
  if (params?.spacer_thickness) {
    tags.push(`${params.spacer_thickness} мм`);
  }
  if (params?.package_quantity) {
    tags.push(`Комплект ${params.package_quantity} шт.`);
  }
  if (params?.is_run_flat) {
    tags.push('Run Flat');
  }
  if (params?.is_spiked) {
    tags.push('Шип');
  }
  if (params?.anti_puncture) {
    tags.push('Антипрокол');
  }
  if (params?.is_c_type) {
    tags.push('Вантажна C');
  }
  if (params?.tire_terrain) {
    tags.push(lotTireTerrainLabels[params.tire_terrain] ?? params.tire_terrain);
  }

  return unique(tags);
};

export const getLotSearchableText = (lot: LotLike): string => {
  const params = lot.params;
  const sizeLabel = getLotSizeLabel(lot);
  const width = params?.width ? String(params.width) : '';
  const profile = params?.profile ? String(params.profile) : '';
  const diameter = params?.diameter ? String(params.diameter) : '';
  const year = params?.production_year ? String(params.production_year) : '';
  const condition = lot.condition ?? '';
  const conditionLabel = condition ? lotConditionLabels[condition] ?? condition : '';

  return [
    lot.id ?? '',
    lot.brand ?? '',
    lot.model ?? '',
    lot.type ?? '',
    lotTypeLabels[lot.type ?? ''] ?? '',
    sizeLabel,
    sizeLabel.replaceAll(' ', ''),
    `${width}/${profile}`,
    `${width}/${profile}r${diameter}`,
    `${width} ${profile} ${diameter}`,
    width,
    profile,
    diameter ? `r${diameter}` : '',
    year,
    condition,
    conditionLabel,
    params?.season ?? '',
    lotSeasonLabels[params?.season ?? ''] ?? '',
    params?.is_c_type ? 'вантажна c' : '',
    params?.tire_terrain ?? '',
    lotTireTerrainLabels[params?.tire_terrain ?? ''] ?? '',
    params?.country_of_origin ?? '',
    params?.rim_material ?? '',
    lotRimMaterialLabels[params?.rim_material ?? ''] ?? '',
    params?.pcd ?? '',
    params?.dia ? String(params.dia) : '',
    params?.et || params?.et === 0 ? String(params.et) : '',
    lotAccessoryCategoryLabels[params?.accessory_category ?? ''] ?? '',
    lotFastenerTypeLabels[params?.fastener_type ?? ''] ?? '',
    lotSpacerTypeLabels[params?.spacer_type ?? ''] ?? '',
    params?.thread_size ?? '',
    params?.seat_type ?? '',
    params?.ring_inner_diameter ? String(params.ring_inner_diameter) : '',
    params?.ring_outer_diameter ? String(params.ring_outer_diameter) : '',
    params?.spacer_thickness ? String(params.spacer_thickness) : '',
    params?.package_quantity ? String(params.package_quantity) : '',
  ]
    .join(' ')
    .toLowerCase();
};
