import { useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import {
  useCreateWarehouse,
  useDeleteWarehouse,
  useStaffWarehouses,
  useUpdateWarehouse,
} from '../api/staffWarehouses';
import type { CreateWarehouseDTO, UpdateWarehouseDTO, Warehouse } from '../types/warehouse';

type WarehouseFormState = {
  name: string;
  location: string;
  is_active: boolean;
};

type ModalState =
  | { mode: 'create' }
  | { mode: 'edit'; warehouse: Warehouse }
  | null;

const createInitialFormState = (warehouse?: Warehouse): WarehouseFormState => ({
  name: warehouse?.name ?? '',
  location: warehouse?.location ?? '',
  is_active: warehouse?.is_active ?? true,
});

const extractApiErrorMessage = (error: unknown): string => {
  if (!isAxiosError(error)) {
    return 'Невідома помилка. Спробуйте ще раз.';
  }

  const status = error.response?.status;
  const data = error.response?.data;

  if (typeof data === 'string' && data.trim()) {
    return `${status ? `HTTP ${status}: ` : ''}${data}`;
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const message =
      (typeof record.message === 'string' && record.message) ||
      (typeof record.error === 'string' && record.error) ||
      (typeof record.detail === 'string' && record.detail) ||
      (typeof record.title === 'string' && record.title);

    if (message) {
      return `${status ? `HTTP ${status}: ` : ''}${message}`;
    }

    const flattened = Object.values(record)
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .join('; ');

    if (flattened) {
      return `${status ? `HTTP ${status}: ` : ''}${flattened}`;
    }
  }

  return `${status ? `HTTP ${status}. ` : ''}${error.message || 'Помилка запиту до сервера.'}`;
};

export default function WarehouseView() {
  const [modalState, setModalState] = useState<ModalState>(null);
  const [form, setForm] = useState<WarehouseFormState>(createInitialFormState());
  const [formError, setFormError] = useState<string | null>(null);

  const { data: warehouses = [], isLoading, isError, isFetching } = useStaffWarehouses();
  const createWarehouseMutation = useCreateWarehouse();
  const updateWarehouseMutation = useUpdateWarehouse();
  const deleteWarehouseMutation = useDeleteWarehouse();

  const isSubmitting = createWarehouseMutation.isPending || updateWarehouseMutation.isPending;

  const closeModal = () => {
    if (isSubmitting) return;
    setModalState(null);
    setFormError(null);
  };

  const handleDeleteWarehouse = async (warehouse: Warehouse) => {
    const isConfirmed = window.confirm(`Видалити склад "${warehouse.name}"?`);
    if (!isConfirmed) return;

    try {
      await deleteWarehouseMutation.mutateAsync(warehouse.id);
    } catch (error) {
      alert(`Не вдалося видалити склад: ${extractApiErrorMessage(error)}`);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const name = form.name.trim();
    const location = form.location.trim();

    if (!name || name.length < 3) {
      setFormError("Назва складу повинна містити мінімум 3 символи.");
      return;
    }
    if (!location) {
      setFormError('Вкажіть локацію складу.');
      return;
    }

    try {
      if (!modalState || modalState.mode === 'create') {
        const payload: CreateWarehouseDTO = { name, location };
        await createWarehouseMutation.mutateAsync(payload);
      } else {
        const payload: UpdateWarehouseDTO = { name, location, is_active: form.is_active };
        await updateWarehouseMutation.mutateAsync({ id: modalState.warehouse.id, payload });
      }

      setModalState(null);
      setFormError(null);
    } catch (error) {
      setFormError(`Не вдалося зберегти склад: ${extractApiErrorMessage(error)}`);
    }
  };

  return (
    <section className="space-y-4 p-4 text-white">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Склади</h2>
        <button
          type="button"
          onClick={() => {
            setForm(createInitialFormState());
            setModalState({ mode: 'create' });
          }}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Додати склад
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-400">Завантаження складів...</div>
      ) : null}

      {isError ? (
        <div className="rounded-xl border border-red-800/60 bg-red-950/30 p-4 text-sm text-red-300">
          Не вдалося завантажити склади.
        </div>
      ) : null}

      {!isLoading && !isError && warehouses.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-400">Склади не знайдені.</div>
      ) : null}

      <div className="space-y-3">
        {warehouses.map((warehouse) => (
          <article key={warehouse.id} className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-base font-semibold text-white">{warehouse.name}</h3>
                <p className="break-words text-sm text-gray-300">{warehouse.location}</p>
                <p className="mt-1 text-xs text-gray-500">ID: {warehouse.id}</p>
              </div>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  warehouse.is_active
                    ? 'border border-emerald-700/60 bg-emerald-900/30 text-emerald-200'
                    : 'border border-zinc-700/60 bg-zinc-800/70 text-zinc-300'
                }`}
              >
                {warehouse.is_active ? 'Активний' : 'Неактивний'}
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setForm(createInitialFormState(warehouse));
                  setModalState({ mode: 'edit', warehouse });
                }}
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-100 transition hover:bg-gray-700"
              >
                Редагувати
              </button>
              <button
                type="button"
                onClick={() => handleDeleteWarehouse(warehouse)}
                className="rounded-lg border border-red-700/70 bg-red-900/25 px-3 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-900/40"
              >
                Видалити
              </button>
            </div>
          </article>
        ))}
      </div>

      {isFetching && !isLoading ? <p className="text-xs text-gray-500">Оновлення списку...</p> : null}

      {modalState ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900 p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {modalState.mode === 'create' ? 'Новий склад' : 'Редагування складу'}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="rounded-md px-2 py-1 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Закрити
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="space-y-1">
                <span className="text-sm text-gray-300">Назва *</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-gray-300">Локація *</span>
                <input
                  type="text"
                  value={form.location}
                  onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
                  required
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </label>

              {modalState.mode === 'edit' ? (
                <label className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-200">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                  />
                  Активний склад
                </label>
              ) : null}

              {formError ? (
                <div className="rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">{formError}</div>
              ) : null}

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Збереження...' : 'Зберегти'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
