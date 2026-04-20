import type { Dispatch, SetStateAction } from 'react';
import type {
  AccessoryCategory,
  CreateLotDTO,
  FastenerType,
  LotInternalResponse,
  RimMaterial,
  LotSeason,
  SpacerType,
  TireTerrain,
  LotType,
  UpdateLotDTO,
} from '../../types/lot';

export type LotCondition = 'NEW' | 'USED';

export type UploadPhotoResponse = Record<string, string>;

export type CreateModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  mode: 'create';
  onClose: () => void;
  onSubmit: (payload: CreateLotDTO) => Promise<void>;
};

export type EditModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  lot: LotInternalResponse;
  mode: 'edit';
  onClose: () => void;
  onSubmit: (payload: UpdateLotDTO) => Promise<void>;
};

export type LotFormModalProps = CreateModalProps | EditModalProps;

export type LotFormState = {
  brand: string;
  model: string;
  condition: LotCondition;
  type: LotType;
  initialQuantity: string;
  purchasePrice: string;
  sellPrice: string;
  defects: string;
  warehouseId: string;
  photos: string[];
  params: {
    width: string;
    profile: string;
    diameter: string;
    pcd: string;
    dia: string;
    et: string;
    rim_material: '' | RimMaterial;
    production_year: string;
    country_of_origin: string;
    season: '' | LotSeason;
    is_run_flat: boolean;
    is_spiked: boolean;
    is_c_type: boolean;
    tire_terrain: '' | TireTerrain;
    anti_puncture: boolean;
    accessory_category: '' | AccessoryCategory;
    fastener_type: '' | FastenerType;
    thread_size: string;
    seat_type: string;
    ring_inner_diameter: string;
    ring_outer_diameter: string;
    spacer_type: '' | SpacerType;
    spacer_thickness: string;
    package_quantity: string;
  };
};

export type PendingPhotoUpload = {
  id: string;
  fileName: string;
  previewUrl: string;
  status: 'uploading' | 'error';
};

export type SetLotFormState = Dispatch<SetStateAction<LotFormState>>;
