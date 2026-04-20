import type { LotType } from '../../types/lot';
import { conditionOptions, typeOptions } from './constants';
import type { LotCondition, LotFormState, SetLotFormState } from './types';

type Props = {
  form: LotFormState;
  setForm: SetLotFormState;
};

export default function BasicInfoSection({ form, setForm }: Props) {
  return (
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
          onChange={(event) => setForm((prev) => ({ ...prev, condition: event.target.value as LotCondition }))}
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
          onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as LotType }))}
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
  );
}
