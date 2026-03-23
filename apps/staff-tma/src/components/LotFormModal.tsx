import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@tire-crm/shared';
import { useStaffWarehouses } from '../api/staffWarehouses';
import type {
  CreateLotDTO,
  LotInternalResponse,
  LotParams,
  UpdateLotDTO,
} from '../types/lot';

type LotCondition = 'NEW' | 'USED';
type LotType = 'TIRE' | 'RIM';
type LotSeason = 'SUMMER' | 'WINTER' | 'ALL_SEASON';

type UploadPhotoResponse = Record<string, string>;

type CreateModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  mode: 'create';
  onClose: () => void;
  onSubmit: (payload: CreateLotDTO) => Promise<void>;
};

type EditModalProps = {
  isOpen: boolean;
  isSubmitting: boolean;
  lot: LotInternalResponse;
  mode: 'edit';
  onClose: () => void;
  onSubmit: (payload: UpdateLotDTO) => Promise<void>;
};

type LotFormModalProps = CreateModalProps | EditModalProps;

type LotFormState = {
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
    season: '' | LotSeason;
    is_run_flat: boolean;
    is_spiked: boolean;
    anti_puncture: boolean;
  };
};

const conditionOptions: Array<{ label: string; value: LotCondition }> = [
  { value: 'NEW', label: 'Новий' },
  { value: 'USED', label: 'Вживаний' },
];

const typeOptions: Array<{ label: string; value: LotType }> = [
  { value: 'TIRE', label: 'Шина' },
  { value: 'RIM', label: 'Диск' },
];

const seasonOptions: Array<{ label: string; value: LotSeason }> = [
  { value: 'SUMMER', label: 'Літній' },
  { value: 'WINTER', label: 'Зимовий' },
  { value: 'ALL_SEASON', label: 'Всесезонний' },
];

const extractPhotoUrl = (payload: UploadPhotoResponse): string => {
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
  return value === 'RIM' ? 'RIM' : 'TIRE';
};

const normalizeSeason = (value: string | undefined): '' | LotSeason => {
  if (value === 'SUMMER' || value === 'WINTER' || value === 'ALL_SEASON') {
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

const createInitialState = (lot: LotInternalResponse | null): LotFormState => ({
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
    season: normalizeSeason(lot?.params?.season),
    is_run_flat: Boolean(lot?.params?.is_run_flat),
    is_spiked: Boolean(lot?.params?.is_spiked),
    anti_puncture: Boolean(lot?.params?.anti_puncture),
  },
});

const hasMeaningfulParams = (params: LotFormState['params']): boolean => {
  return Boolean(
    params.width.trim() ||
      params.profile.trim() ||
      params.diameter.trim() ||
      params.season ||
      params.is_run_flat ||
      params.is_spiked ||
      params.anti_puncture,
  );
};

const hasInitialParams = (lot: LotInternalResponse | null): boolean => {
  if (!lot?.params) {
    return false;
  }
  return Object.keys(lot.params).length > 0;
};

const toDecimal = (value: string): number => Number(value.replace(',', '.'));
const toInteger = (value: string): number => Number.parseInt(value, 10);

const buildParamsPayload = (params: LotFormState['params']): LotParams => {
  const payload: LotParams = {
    anti_puncture: params.anti_puncture,
    is_run_flat: params.is_run_flat,
    is_spiked: params.is_spiked,
  };

  if (params.width.trim()) payload.width = toInteger(params.width);
  if (params.profile.trim()) payload.profile = toInteger(params.profile);
  if (params.diameter.trim()) payload.diameter = toInteger(params.diameter);
  if (params.season) payload.season = params.season;

  return payload;
};

export default function LotFormModal(props: LotFormModalProps) {
  const editLot = props.mode === 'edit' ? props.lot : null;
  const [form, setForm] = useState<LotFormState>(() => createInitialState(editLot));
  const [formError, setFormError] = useState<string | null>(null);
  const { data: warehouses = [], isLoading: isWarehousesLoading } = useStaffWarehouses();
  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await apiClient.post<UploadPhotoResponse>('/staff/lots/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return extractPhotoUrl(data ?? {});
    },
  });

  const shouldIncludeParams = useMemo(() => {
    if (props.mode === 'edit' && hasInitialParams(editLot)) {
      return true;
    }
    return hasMeaningfulParams(form.params);
  }, [editLot, form.params, props.mode]);

  const warehouseOptions = useMemo(() => {
    const mapped = warehouses.map((warehouse) => ({
      value: warehouse.id,
      label: `${warehouse.name} (${warehouse.location})`,
    }));

    if (form.warehouseId && !mapped.some((option) => option.value === form.warehouseId)) {
      return [{ value: form.warehouseId, label: `Поточний: ${form.warehouseId}` }, ...mapped];
    }

    return mapped;
  }, [form.warehouseId, warehouses]);

  if (!props.isOpen) {
    return null;
  }

  const handleUploadPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    try {
      setFormError(null);
      const uploadedUrl = await uploadPhotoMutation.mutateAsync(file);
      setForm((prev) => {
        if (prev.photos.includes(uploadedUrl)) {
          return prev;
        }
        return { ...prev, photos: [...prev.photos, uploadedUrl] };
      });
    } catch {
      setFormError('Не вдалося завантажити фото. Спробуйте ще раз.');
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const brand = form.brand.trim();
    const model = form.model.trim();
    const defects = form.defects.trim();
    const warehouseId = form.warehouseId.trim();
    const purchasePrice = toDecimal(form.purchasePrice);
    const sellPrice = toDecimal(form.sellPrice);

    if (!brand) {
      setFormError('Вкажіть бренд товару.');
      return;
    }
    if (!Number.isFinite(purchasePrice)) {
      setFormError('Некоректна закупівельна ціна.');
      return;
    }
    if (!Number.isFinite(sellPrice)) {
      setFormError('Некоректна ціна продажу.');
      return;
    }

    const photos = form.photos;
    const params = shouldIncludeParams ? buildParamsPayload(form.params) : undefined;

    try {
      if (props.mode === 'create') {
        const initialQuantity = toInteger(form.initialQuantity);
        if (!Number.isInteger(initialQuantity) || initialQuantity < 0) {
          setFormError('Початкова кількість повинна бути цілим числом від 0.');
          return;
        }
        if (!warehouseId) {
          setFormError('Оберіть склад зі списку.');
          return;
        }

        const payload: CreateLotDTO = {
          brand,
          model: model || undefined,
          condition: form.condition,
          type: form.type,
          initial_quantity: initialQuantity,
          purchase_price: purchasePrice,
          sell_price: sellPrice,
          defects: defects || undefined,
          photos: photos.length > 0 ? photos : undefined,
          params,
          warehouse_id: warehouseId,
        };

        await props.onSubmit(payload);
      } else {
        const payload: UpdateLotDTO = {
          brand,
          model,
          condition: form.condition,
          type: form.type,
          purchase_price: purchasePrice,
          sell_price: sellPrice,
          defects,
          photos,
          params,
          warehouse_id: warehouseId || undefined,
        };

        await props.onSubmit(payload);
      }
    } catch {
      setFormError('Не вдалося зберегти товар. Перевірте дані та повторіть спробу.');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 print:hidden sm:items-center">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-900 px-4 py-3">
          <h2 className="text-lg font-semibold text-white">
            {props.mode === 'create' ? 'Створення товару' : 'Редагування товару'}
          </h2>
          <button
            type="button"
            onClick={props.onClose}
            disabled={props.isSubmitting || uploadPhotoMutation.isPending}
            className="rounded-md px-2 py-1 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Закрити
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-4">
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm text-gray-300">Бренд *</span>
              <input
                type="text"
                value={form.brand}
                onChange={(event) => setForm((prev) => ({ ...prev, brand: event.target.value }))}
                required
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm text-gray-300">Модель</span>
              <input
                type="text"
                value={form.model}
                onChange={(event) => setForm((prev) => ({ ...prev, model: event.target.value }))}
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm text-gray-300">Стан *</span>
              <select
                value={form.condition}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    condition: event.target.value as LotCondition,
                  }))
                }
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
              >
                {conditionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm text-gray-300">Тип *</span>
              <select
                value={form.type}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    type: event.target.value as LotType,
                  }))
                }
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {props.mode === 'create' ? (
              <label className="space-y-1">
                <span className="text-sm text-gray-300">Початкова кількість *</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.initialQuantity}
                  onChange={(event) => setForm((prev) => ({ ...prev, initialQuantity: event.target.value }))}
                  required
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </label>
            ) : (
              <div className="rounded-lg border border-gray-800 bg-gray-950 px-3 py-2">
                <p className="text-xs text-gray-400">Початкова кількість</p>
                <p className="text-sm font-semibold text-white">{props.lot.initial_quantity}</p>
              </div>
            )}

            <label className="space-y-1">
              <span className="text-sm text-gray-300">Закупівельна ціна *</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.purchasePrice}
                onChange={(event) => setForm((prev) => ({ ...prev, purchasePrice: event.target.value }))}
                required
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm text-gray-300">Ціна продажу *</span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.sellPrice}
                onChange={(event) => setForm((prev) => ({ ...prev, sellPrice: event.target.value }))}
                required
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
              />
            </label>
          </section>

          <section className="space-y-3">
            <label className="space-y-1">
              <span className="text-sm text-gray-300">Склад {props.mode === 'create' ? '*' : '(опціонально)'}</span>
              <select
                value={form.warehouseId}
                onChange={(event) => setForm((prev) => ({ ...prev, warehouseId: event.target.value }))}
                required={props.mode === 'create'}
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
              >
                <option value="">{isWarehousesLoading ? 'Завантаження складів...' : 'Оберіть склад'}</option>
                {warehouseOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm text-gray-300">Дефекти</span>
              <textarea
                value={form.defects}
                onChange={(event) => setForm((prev) => ({ ...prev, defects: event.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
              />
            </label>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Параметри</h3>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <label className="space-y-1">
                <span className="text-sm text-gray-300">Ширина</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.params.width}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      params: { ...prev.params, width: event.target.value },
                    }))
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-gray-300">Профіль</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.params.profile}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      params: { ...prev.params, profile: event.target.value },
                    }))
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-gray-300">Діаметр</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.params.diameter}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      params: { ...prev.params, diameter: event.target.value },
                    }))
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-gray-300">Сезон</span>
                <select
                  value={form.params.season}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      params: {
                        ...prev.params,
                        season: event.target.value as '' | LotSeason,
                      },
                    }))
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                >
                  <option value="">Не вказано</option>
                  {seasonOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <label className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-200">
                <input
                  type="checkbox"
                  checked={form.params.is_run_flat}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      params: { ...prev.params, is_run_flat: event.target.checked },
                    }))
                  }
                />
                Run Flat
              </label>

              <label className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-200">
                <input
                  type="checkbox"
                  checked={form.params.is_spiked}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      params: { ...prev.params, is_spiked: event.target.checked },
                    }))
                  }
                />
                Шипована
              </label>

              <label className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-200">
                <input
                  type="checkbox"
                  checked={form.params.anti_puncture}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      params: { ...prev.params, anti_puncture: event.target.checked },
                    }))
                  }
                />
                Антипрокол
              </label>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Фото</h3>
              <label className="inline-flex cursor-pointer items-center rounded-lg border border-blue-700/60 bg-blue-900/25 px-3 py-2 text-xs font-semibold text-blue-200 transition hover:bg-blue-900/40">
                {uploadPhotoMutation.isPending ? 'Завантаження...' : 'Завантажити фото'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleUploadPhoto}
                  disabled={uploadPhotoMutation.isPending || props.isSubmitting}
                  className="hidden"
                />
              </label>
            </div>

            {form.photos.length === 0 ? (
              <p className="text-sm text-gray-500">Фото не додані.</p>
            ) : (
              <div className="space-y-2">
                {form.photos.map((photoUrl) => (
                  <div
                    key={photoUrl}
                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2"
                  >
                    <a
                      href={photoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-xs text-blue-300 hover:text-blue-200"
                    >
                      {photoUrl}
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          photos: prev.photos.filter((url) => url !== photoUrl),
                        }))
                      }
                      disabled={props.isSubmitting}
                      className="rounded-md px-2 py-1 text-xs text-red-300 transition hover:bg-red-900/30 disabled:opacity-50"
                    >
                      Видалити
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {formError ? (
            <div className="rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">{formError}</div>
          ) : null}

          <div className="flex justify-end gap-2 border-t border-gray-800 pt-4">
            <button
              type="button"
              onClick={props.onClose}
              disabled={props.isSubmitting || uploadPhotoMutation.isPending}
              className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Скасувати
            </button>
            <button
              type="submit"
              disabled={props.isSubmitting || uploadPhotoMutation.isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {props.isSubmitting
                ? 'Збереження...'
                : props.mode === 'create'
                  ? 'Створити товар'
                  : 'Зберегти зміни'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
