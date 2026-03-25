export type LotType = 'TIRE' | 'RIM' | 'ACCESSORY';
export type LotCondition = 'NEW' | 'USED';

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

const seasonLabelMap: Record<string, string> = {
  SUMMER: 'Літо',
  WINTER: 'Зима',
  ALL_SEASON: 'Всесезон',
};

const conditionLabelMap: Record<string, string> = {
  NEW: 'Новий',
  USED: 'Вживаний',
};

const accessoryCategoryLabelMap: Record<string, string> = {
  FASTENERS: 'Кріплення',
  HUB_RINGS: 'Проставочні кільця',
  SPACERS: 'Проставки',
  TIRE_BAGS: 'Пакети для шин',
};

const fastenerTypeLabelMap: Record<string, string> = {
  NUT: 'Гайки',
  BOLT: 'Болти',
};

const spacerTypeLabelMap: Record<string, string> = {
  ADAPTER: 'Адаптер',
  EXTENDER: 'Розширювач',
};

const rimMaterialLabelMap: Record<string, string> = {
  STEEL: 'Металеві',
  ALLOY: 'Легкосплавні',
};

const typeLabelMap: Record<string, string> = {
  TIRE: 'Шини',
  RIM: 'Диски',
  ACCESSORY: 'Супутні товари',
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
  const rimMaterialLabel = params?.rim_material ? rimMaterialLabelMap[params.rim_material] ?? params.rim_material : '';

  if (lot.condition) {
    tags.push(conditionLabelMap[lot.condition] ?? lot.condition);
  }
  if (params?.season) {
    tags.push(seasonLabelMap[params.season] ?? params.season);
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
    tags.push(typeLabelMap[lot.type] ?? lot.type);
  }
  if (params?.accessory_category) {
    tags.push(accessoryCategoryLabelMap[params.accessory_category] ?? params.accessory_category);
  }
  if (params?.fastener_type) {
    tags.push(fastenerTypeLabelMap[params.fastener_type] ?? params.fastener_type);
  }
  if (params?.spacer_type) {
    tags.push(spacerTypeLabelMap[params.spacer_type] ?? params.spacer_type);
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
  const conditionLabel = condition ? conditionLabelMap[condition] ?? condition : '';

  return [
    lot.id ?? '',
    lot.brand ?? '',
    lot.model ?? '',
    lot.type ?? '',
    typeLabelMap[lot.type ?? ''] ?? '',
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
    seasonLabelMap[params?.season ?? ''] ?? '',
    params?.country_of_origin ?? '',
    params?.rim_material ?? '',
    rimMaterialLabelMap[params?.rim_material ?? ''] ?? '',
    params?.pcd ?? '',
    params?.dia ? String(params.dia) : '',
    params?.et || params?.et === 0 ? String(params.et) : '',
    accessoryCategoryLabelMap[params?.accessory_category ?? ''] ?? '',
    fastenerTypeLabelMap[params?.fastener_type ?? ''] ?? '',
    spacerTypeLabelMap[params?.spacer_type ?? ''] ?? '',
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
