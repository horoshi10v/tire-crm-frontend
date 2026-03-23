import { useMemo, useState, type FormEvent } from 'react';
import { isAxiosError } from 'axios';
import { useStaffLots } from '../api/staffLots';
import {
  useAcceptTransfer,
  useCancelTransfer,
  useCreateTransfer,
  useStaffTransferById,
  useStaffTransfers,
} from '../api/staffTransfers';
import { useStaffWarehouses } from '../api/staffWarehouses';
import type { CreateTransferDTO, TransferStatus } from '../types/transfer';

type TransferItemForm = {
  lotId: string;
  quantity: string;
};

type CreateTransferFormState = {
  fromWarehouseId: string;
  toWarehouseId: string;
  comment: string;
  items: TransferItemForm[];
};

const transferStatusOptions: Array<{ value: '' | TransferStatus; label: string }> = [
  { value: '', label: 'Усі статуси' },
  { value: 'IN_TRANSIT', label: 'В дорозі' },
  { value: 'ACCEPTED', label: 'Прийнято' },
  { value: 'CANCELLED', label: 'Скасовано' },
];

const getTransferStatusLabel = (status: string): string => {
  if (status === 'IN_TRANSIT') return 'В дорозі';
  if (status === 'ACCEPTED') return 'Прийнято';
  if (status === 'CANCELLED') return 'Скасовано';
  return status;
};

const getTransferStatusClassName = (status: string): string => {
  if (status === 'IN_TRANSIT') return 'border border-amber-700/60 bg-amber-900/30 text-amber-200';
  if (status === 'ACCEPTED') return 'border border-emerald-700/60 bg-emerald-900/30 text-emerald-200';
  if (status === 'CANCELLED') return 'border border-zinc-700/60 bg-zinc-800/70 text-zinc-300';
  return 'border border-blue-700/60 bg-blue-900/30 text-blue-200';
};

const createInitialTransferForm = (): CreateTransferFormState => ({
  fromWarehouseId: '',
  toWarehouseId: '',
  comment: '',
  items: [{ lotId: '', quantity: '1' }],
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
      (typeof record.detail === 'string' && record.detail);

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

const formatDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

export default function TransfersView() {
  const [statusFilter, setStatusFilter] = useState<'' | TransferStatus>('');
  const [fromFilter, setFromFilter] = useState('');
  const [toFilter, setToFilter] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTransferFormState>(createInitialTransferForm());
  const [createFormError, setCreateFormError] = useState<string | null>(null);

  const [detailsTransferId, setDetailsTransferId] = useState<string | null>(null);

  const { data: warehouses = [] } = useStaffWarehouses();
  const warehousesById = useMemo(() => {
    return new Map(warehouses.map((warehouse) => [warehouse.id, warehouse]));
  }, [warehouses]);

  const { data: transfers = [], isLoading, isError, isFetching } = useStaffTransfers({
    page: 1,
    pageSize: 50,
    status: statusFilter,
    fromWarehouseId: fromFilter,
    toWarehouseId: toFilter,
  });

  const { data: transferDetails, isLoading: isTransferDetailsLoading } = useStaffTransferById(detailsTransferId);

  const sourceWarehouseId = createForm.fromWarehouseId;
  const { data: sourceLots = [] } = useStaffLots({
    page: 1,
    pageSize: 200,
    filters: {
      warehouse_id: sourceWarehouseId,
    },
  });

  const createTransferMutation = useCreateTransfer();
  const acceptTransferMutation = useAcceptTransfer();
  const cancelTransferMutation = useCancelTransfer();

  const isActionPending =
    createTransferMutation.isPending || acceptTransferMutation.isPending || cancelTransferMutation.isPending;

  const sortedTransfers = useMemo(() => {
    return [...transfers].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [transfers]);

  const getWarehouseLabel = (warehouseId: string): string => {
    const warehouse = warehousesById.get(warehouseId);
    if (!warehouse) return warehouseId;
    return `${warehouse.name} (${warehouse.location})`;
  };

  const availableSourceLots = useMemo(() => {
    return sourceLots.filter((lot) => {
      if (lot.current_quantity <= 0) return false;
      if (!sourceWarehouseId) return true;
      return lot.warehouse_id === sourceWarehouseId;
    });
  }, [sourceLots, sourceWarehouseId]);

  const availableSourceLotsById = useMemo(() => {
    return new Map(availableSourceLots.map((lot) => [lot.id, lot]));
  }, [availableSourceLots]);

  const closeCreateModal = () => {
    if (createTransferMutation.isPending) return;
    setIsCreateModalOpen(false);
    setCreateFormError(null);
  };

  const resetAndOpenCreateModal = () => {
    setCreateForm(createInitialTransferForm());
    setCreateFormError(null);
    setIsCreateModalOpen(true);
  };

  const addTransferItem = () => {
    setCreateForm((prev) => ({
      ...prev,
      items: [...prev.items, { lotId: '', quantity: '1' }],
    }));
  };

  const updateTransferItem = (index: number, patch: Partial<TransferItemForm>) => {
    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)),
    }));
  };

  const removeTransferItem = (index: number) => {
    setCreateForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  };

  const handleCreateTransfer = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateFormError(null);

    const fromWarehouseId = createForm.fromWarehouseId.trim();
    const toWarehouseId = createForm.toWarehouseId.trim();
    const comment = createForm.comment.trim();

    if (!fromWarehouseId) {
      setCreateFormError('Оберіть склад-відправник.');
      return;
    }
    if (!toWarehouseId) {
      setCreateFormError('Оберіть склад-отримувач.');
      return;
    }
    if (fromWarehouseId === toWarehouseId) {
      setCreateFormError('Склади відправника та отримувача повинні відрізнятися.');
      return;
    }
    if (createForm.items.length === 0) {
      setCreateFormError('Додайте хоча б одну позицію для трансферу.');
      return;
    }

    const normalizedItems: CreateTransferDTO['items'] = [];
    const requestedQuantityByLot = new Map<string, number>();
    for (const item of createForm.items) {
      const lotId = item.lotId.trim();
      const quantity = Number.parseInt(item.quantity, 10);

      if (!lotId) {
        setCreateFormError('Оберіть лот для кожної позиції.');
        return;
      }
      if (!Number.isInteger(quantity) || quantity <= 0) {
        setCreateFormError('Кількість повинна бути цілим числом більше 0.');
        return;
      }

      const selectedLot = availableSourceLotsById.get(lotId);
      if (!selectedLot) {
        setCreateFormError(`Лот ${lotId} не належить складу-відправнику або недоступний для трансферу.`);
        return;
      }
      if (selectedLot.warehouse_id !== fromWarehouseId) {
        setCreateFormError(`Лот ${lotId} не належить обраному складу-відправнику.`);
        return;
      }

      const accumulatedQuantity = (requestedQuantityByLot.get(lotId) ?? 0) + quantity;
      if (accumulatedQuantity > selectedLot.current_quantity) {
        setCreateFormError(
          `Для лота ${selectedLot.brand} ${selectedLot.model ?? ''} запрошено ${accumulatedQuantity}, доступно ${selectedLot.current_quantity}.`,
        );
        return;
      }
      requestedQuantityByLot.set(lotId, accumulatedQuantity);

      normalizedItems.push({ lot_id: lotId, quantity });
    }

    try {
      await createTransferMutation.mutateAsync({
        from_warehouse_id: fromWarehouseId,
        to_warehouse_id: toWarehouseId,
        items: normalizedItems,
        comment: comment || undefined,
      });
      setIsCreateModalOpen(false);
      setCreateFormError(null);
    } catch (error) {
      setCreateFormError(`Не вдалося створити трансфер: ${extractApiErrorMessage(error)}`);
    }
  };

  const handleAcceptTransfer = async (transferId: string) => {
    const isConfirmed = window.confirm('Підтвердити приймання трансферу?');
    if (!isConfirmed) return;

    try {
      await acceptTransferMutation.mutateAsync(transferId);
      setDetailsTransferId((prev) => (prev === transferId ? prev : prev));
    } catch (error) {
      alert(`Не вдалося прийняти трансфер: ${extractApiErrorMessage(error)}`);
    }
  };

  const handleCancelTransfer = async (transferId: string) => {
    const isConfirmed = window.confirm('Скасувати трансфер і повернути залишки?');
    if (!isConfirmed) return;

    try {
      await cancelTransferMutation.mutateAsync(transferId);
      setDetailsTransferId((prev) => (prev === transferId ? prev : prev));
    } catch (error) {
      alert(`Не вдалося скасувати трансфер: ${extractApiErrorMessage(error)}`);
    }
  };

  return (
    <section className="space-y-4 p-4 text-white">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Трансфери</h2>
        <button
          type="button"
          onClick={resetAndOpenCreateModal}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Новий трансфер
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <label className="space-y-1">
          <span className="text-sm text-gray-300">Статус</span>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as '' | TransferStatus)}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500"
          >
            {transferStatusOptions.map((option) => (
              <option key={option.value || 'all'} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm text-gray-300">Зі складу</span>
          <select
            value={fromFilter}
            onChange={(event) => setFromFilter(event.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500"
          >
            <option value="">Усі</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1">
          <span className="text-sm text-gray-300">На склад</span>
          <select
            value={toFilter}
            onChange={(event) => setToFilter(event.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500"
          >
            <option value="">Усі</option>
            {warehouses.map((warehouse) => (
              <option key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-400">Завантаження трансферів...</div>
      ) : null}

      {isError ? (
        <div className="rounded-xl border border-red-800/60 bg-red-950/30 p-4 text-sm text-red-300">
          Не вдалося завантажити трансфери.
        </div>
      ) : null}

      {!isLoading && !isError && sortedTransfers.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-400">Трансфери не знайдено.</div>
      ) : null}

      <div className="space-y-3">
        {sortedTransfers.map((transfer) => (
          <article key={transfer.id} className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold text-white">{transfer.id}</h3>
                <p className="mt-1 break-words text-xs text-gray-300">
                  {getWarehouseLabel(transfer.from_warehouse_id)} → {getWarehouseLabel(transfer.to_warehouse_id)}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {formatDateTime(transfer.created_at)} • Позицій: {transfer.items.length}
                </p>
                {transfer.comment ? <p className="mt-1 break-words text-xs text-gray-400">{transfer.comment}</p> : null}
              </div>

              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getTransferStatusClassName(transfer.status)}`}>
                {getTransferStatusLabel(transfer.status)}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDetailsTransferId(transfer.id)}
                className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-100 transition hover:bg-gray-700"
              >
                Деталі
              </button>
              <button
                type="button"
                disabled={transfer.status !== 'IN_TRANSIT' || isActionPending}
                onClick={() => handleAcceptTransfer(transfer.id)}
                className="rounded-lg border border-emerald-700/60 bg-emerald-900/30 px-3 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-900/45 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Прийняти
              </button>
              <button
                type="button"
                disabled={transfer.status !== 'IN_TRANSIT' || isActionPending}
                onClick={() => handleCancelTransfer(transfer.id)}
                className="rounded-lg border border-red-700/60 bg-red-900/25 px-3 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Скасувати
              </button>
            </div>
          </article>
        ))}
      </div>

      {isFetching && !isLoading ? <p className="text-xs text-gray-500">Оновлення списку...</p> : null}

      {isCreateModalOpen ? (
        <div className="fixed inset-0 z-[82] flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-800 bg-gray-900 p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Новий трансфер</h3>
              <button
                type="button"
                onClick={closeCreateModal}
                disabled={createTransferMutation.isPending}
                className="rounded-md px-2 py-1 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Закрити
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="space-y-1">
                  <span className="text-sm text-gray-300">Склад-відправник *</span>
                  <select
                    value={createForm.fromWarehouseId}
                    onChange={(event) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        fromWarehouseId: event.target.value,
                        items: [{ lotId: '', quantity: '1' }],
                      }))
                    }
                    required
                    className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                  >
                    <option value="">Оберіть склад</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} ({warehouse.location})
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-sm text-gray-300">Склад-отримувач *</span>
                  <select
                    value={createForm.toWarehouseId}
                    onChange={(event) => setCreateForm((prev) => ({ ...prev, toWarehouseId: event.target.value }))}
                    required
                    className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                  >
                    <option value="">Оберіть склад</option>
                    {warehouses
                      .filter((warehouse) => warehouse.id !== createForm.fromWarehouseId)
                      .map((warehouse) => (
                        <option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name} ({warehouse.location})
                        </option>
                      ))}
                  </select>
                </label>
              </div>

              <label className="space-y-1">
                <span className="text-sm text-gray-300">Коментар</span>
                <textarea
                  value={createForm.comment}
                  onChange={(event) => setCreateForm((prev) => ({ ...prev, comment: event.target.value }))}
                  rows={2}
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </label>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-300">Позиції трансферу</h4>
                  <button
                    type="button"
                    onClick={addTransferItem}
                    className="rounded-md border border-gray-700 bg-gray-800 px-2 py-1 text-xs font-semibold text-gray-100 transition hover:bg-gray-700"
                  >
                    + Додати позицію
                  </button>
                </div>

                <div className="space-y-2">
                  {createForm.items.map((item, index) => (
                    <div key={`transfer-item-${index}`} className="grid grid-cols-[1fr_90px_auto] gap-2">
                      <select
                        value={item.lotId}
                        onChange={(event) => updateTransferItem(index, { lotId: event.target.value })}
                        className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                      >
                        <option value="">
                          {createForm.fromWarehouseId ? 'Оберіть лот' : 'Спочатку оберіть склад-відправник'}
                        </option>
                        {availableSourceLots.map((lot) => (
                          <option key={lot.id} value={lot.id}>
                            {lot.brand} {lot.model} • ID {lot.id.slice(0, 8)} • К-сть {lot.current_quantity}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min={1}
                        step={1}
                        value={item.quantity}
                        onChange={(event) => updateTransferItem(index, { quantity: event.target.value })}
                        className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                      />

                      <button
                        type="button"
                        onClick={() => removeTransferItem(index)}
                        disabled={createForm.items.length === 1}
                        className="rounded-lg border border-red-700/70 bg-red-900/25 px-3 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {createFormError ? (
                <div className="rounded-lg border border-red-800/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">{createFormError}</div>
              ) : null}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={createTransferMutation.isPending}
                  className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-semibold text-gray-200 transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Скасувати
                </button>
                <button
                  type="submit"
                  disabled={createTransferMutation.isPending}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createTransferMutation.isPending ? 'Створення...' : 'Створити трансфер'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {detailsTransferId ? (
        <div className="fixed inset-0 z-[81] flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-gray-800 bg-gray-900 p-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Деталі трансферу</h3>
              <button
                type="button"
                onClick={() => setDetailsTransferId(null)}
                className="rounded-md px-2 py-1 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-gray-200"
              >
                Закрити
              </button>
            </div>

            {isTransferDetailsLoading || !transferDetails ? (
              <div className="rounded-xl border border-gray-800 bg-gray-950 p-4 text-sm text-gray-400">Завантаження деталей...</div>
            ) : (
              <div className="space-y-3 text-sm text-gray-200">
                <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
                  <p className="break-all">ID: {transferDetails.id}</p>
                  <p className="mt-1">Статус: {getTransferStatusLabel(transferDetails.status)}</p>
                  <p className="mt-1">Створено: {formatDateTime(transferDetails.created_at)}</p>
                  <p className="mt-1">Зі складу: {getWarehouseLabel(transferDetails.from_warehouse_id)}</p>
                  <p className="mt-1">На склад: {getWarehouseLabel(transferDetails.to_warehouse_id)}</p>
                  {transferDetails.comment ? <p className="mt-1 break-words">Коментар: {transferDetails.comment}</p> : null}
                </div>

                <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
                  <p className="mb-2 text-xs uppercase tracking-wider text-gray-400">Позиції</p>
                  <div className="space-y-2">
                    {transferDetails.items.map((item) => (
                      <div key={item.id} className="rounded-lg border border-gray-800 bg-gray-900 px-3 py-2">
                        <p>Лот: {item.source_lot_id}</p>
                        <p>Кількість: {item.quantity}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {transferDetails.status === 'IN_TRANSIT' ? (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleAcceptTransfer(transferDetails.id)}
                      disabled={isActionPending}
                      className="rounded-lg border border-emerald-700/60 bg-emerald-900/30 px-3 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-900/45 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Прийняти
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCancelTransfer(transferDetails.id)}
                      disabled={isActionPending}
                      className="rounded-lg border border-red-700/60 bg-red-900/25 px-3 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Скасувати
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
