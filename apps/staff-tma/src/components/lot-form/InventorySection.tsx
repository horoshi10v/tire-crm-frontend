import type { LotFormState, LotFormModalProps, SetLotFormState } from './types';

type WarehouseOption = {
  value: string;
  label: string;
};

type Props = {
  form: LotFormState;
  setForm: SetLotFormState;
  props: LotFormModalProps;
  warehouseOptions: WarehouseOption[];
  isWarehousesLoading: boolean;
};

export default function InventorySection({ form, setForm, props, warehouseOptions, isWarehousesLoading }: Props) {
  return (
    <>
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
    </>
  );
}
