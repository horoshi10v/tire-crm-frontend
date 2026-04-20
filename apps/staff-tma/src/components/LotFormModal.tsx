import { useMemo, useState, type FormEvent } from 'react';
import { useStaffWarehouses } from '../api/staffWarehouses';
import type { CreateLotDTO, UpdateLotDTO } from '../types/lot';
import BasicInfoSection from './lot-form/BasicInfoSection';
import InventorySection from './lot-form/InventorySection';
import ParamsSection from './lot-form/ParamsSection';
import PhotoUploadSection from './lot-form/PhotoUploadSection';
import { buildParamsPayload, createInitialState, hasInitialParams, hasMeaningfulParams, reorderItems, toDecimal, toInteger } from './lot-form/helpers';
import type { LotFormModalProps, LotFormState } from './lot-form/types';
import useLotPhotoUpload from './lot-form/useLotPhotoUpload';

export default function LotFormModal(props: LotFormModalProps) {
  const editLot = props.mode === 'edit' ? props.lot : null;
  const [form, setForm] = useState<LotFormState>(() => createInitialState(editLot));
  const [formError, setFormError] = useState<string | null>(null);
  const { data: warehouses = [], isLoading: isWarehousesLoading } = useStaffWarehouses();

  const shouldIncludeParams = useMemo(() => {
    if (props.mode === 'edit' && hasInitialParams(editLot)) {
      return true;
    }
    return hasMeaningfulParams(form.params);
  }, [editLot, form.params, props.mode]);
  const {
    uploadPhotoMutation,
    isUploadingPhotos,
    uploadingPhotosCount,
    uploadProgress,
    hasActiveUploadProgress,
    pendingPhotoUploads,
    isDragOver,
    handleUploadPhoto,
    handleDropPhotos,
    handleDragOver,
    handleDragLeave,
    handlePendingPhotoMove,
  } = useLotPhotoUpload({
    isSubmitting: props.isSubmitting,
    setForm,
    setFormError,
  });

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
          <h2 className="text-lg font-semibold text-white">{props.mode === 'create' ? 'Створення товару' : 'Редагування товару'}</h2>
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
          <BasicInfoSection form={form} setForm={setForm} />
          <InventorySection
            form={form}
            setForm={setForm}
            props={props}
            warehouseOptions={warehouseOptions}
            isWarehousesLoading={isWarehousesLoading}
          />
          <ParamsSection form={form} setForm={setForm} />
          <PhotoUploadSection
            isDragOver={isDragOver}
            isUploadingPhotos={isUploadingPhotos}
            uploadingPhotosCount={uploadingPhotosCount}
            isSubmitting={props.isSubmitting}
            uploadProgress={uploadProgress}
            hasActiveUploadProgress={hasActiveUploadProgress}
            pendingPhotoUploads={pendingPhotoUploads}
            photos={form.photos}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={(event) => void handleDropPhotos(event)}
            onFileInputChange={handleUploadPhoto}
            onRemovePhoto={(photoUrl) =>
              setForm((prev) => ({
                ...prev,
                photos: prev.photos.filter((url) => url !== photoUrl),
              }))
            }
            onReorderPhoto={(fromPhotoUrl, toPhotoUrl) =>
              setForm((prev) => ({
                ...prev,
                photos: reorderItems(prev.photos, fromPhotoUrl, toPhotoUrl),
              }))
            }
            onReorderPendingPhoto={handlePendingPhotoMove}
          />

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
              {props.isSubmitting ? 'Збереження...' : props.mode === 'create' ? 'Створити товар' : 'Зберегти зміни'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
