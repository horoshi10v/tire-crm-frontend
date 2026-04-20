import type { AccessoryCategory, FastenerType, RimMaterial, LotSeason, SpacerType, TireTerrain, LotType } from '../../types/lot';
import type { LotCondition } from './types';

export const conditionOptions: Array<{ label: string; value: LotCondition }> = [
  { value: 'NEW', label: 'Новий' },
  { value: 'USED', label: 'Вживаний' },
];

export const typeOptions: Array<{ label: string; value: LotType }> = [
  { value: 'TIRE', label: 'Шина' },
  { value: 'RIM', label: 'Диск' },
  { value: 'ACCESSORY', label: 'Супутній товар' },
];

export const seasonOptions: Array<{ label: string; value: LotSeason }> = [
  { value: 'SUMMER', label: 'Літній' },
  { value: 'WINTER', label: 'Зимовий' },
  { value: 'ALL_SEASON', label: 'Всесезонний' },
];

export const accessoryCategoryOptions: Array<{ label: string; value: AccessoryCategory }> = [
  { value: 'FASTENERS', label: 'Кріплення' },
  { value: 'HUB_RINGS', label: 'Проставочні кільця' },
  { value: 'SPACERS', label: 'Проставки' },
  { value: 'TIRE_BAGS', label: 'Пакети для шин' },
];

export const fastenerTypeOptions: Array<{ label: string; value: FastenerType }> = [
  { value: 'NUT', label: 'Гайки' },
  { value: 'BOLT', label: 'Болти' },
];

export const spacerTypeOptions: Array<{ label: string; value: SpacerType }> = [
  { value: 'ADAPTER', label: 'Адаптер' },
  { value: 'EXTENDER', label: 'Розширювальна' },
];

export const rimMaterialOptions: Array<{ label: string; value: RimMaterial }> = [
  { value: 'STEEL', label: 'Металеві' },
  { value: 'ALLOY', label: 'Легкосплавні' },
];

export const tireTerrainOptions: Array<{ label: string; value: TireTerrain }> = [
  { value: 'AT', label: 'A/T' },
  { value: 'MT', label: 'M/T' },
];
