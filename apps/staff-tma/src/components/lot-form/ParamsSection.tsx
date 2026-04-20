import { CountrySearchSelect } from '@tire-crm/shared';
import type {
  AccessoryCategory,
  FastenerType,
  RimMaterial,
  LotSeason,
  SpacerType,
  TireTerrain,
} from '../../types/lot';
import {
  accessoryCategoryOptions,
  fastenerTypeOptions,
  rimMaterialOptions,
  seasonOptions,
  spacerTypeOptions,
  tireTerrainOptions,
} from './constants';
import type { LotFormState, SetLotFormState } from './types';

type Props = {
  form: LotFormState;
  setForm: SetLotFormState;
};

export default function ParamsSection({ form, setForm }: Props) {
  const isAccessory = form.type === 'ACCESSORY';
  const isTire = form.type === 'TIRE';
  const isRim = form.type === 'RIM';

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">Параметри</h3>

      {isAccessory ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm text-gray-300">Категорія супутнього товару</span>
              <select
                value={form.params.accessory_category}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    params: { ...prev.params, accessory_category: event.target.value as '' | AccessoryCategory },
                  }))
                }
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
              >
                <option value="">Оберіть категорію</option>
                {accessoryCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {form.params.accessory_category === 'FASTENERS' ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="space-y-1">
                <span className="text-sm text-gray-300">Тип кріплення</span>
                <select
                  value={form.params.fastener_type}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      params: { ...prev.params, fastener_type: event.target.value as '' | FastenerType },
                    }))
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                >
                  <option value="">Оберіть тип</option>
                  {fastenerTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm text-gray-300">Розмір різьби</span>
                <input
                  type="text"
                  value={form.params.thread_size}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, params: { ...prev.params, thread_size: event.target.value } }))
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-gray-300">Тип посадки</span>
                <input
                  type="text"
                  value={form.params.seat_type}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, params: { ...prev.params, seat_type: event.target.value } }))
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </label>
            </div>
          ) : null}

          {form.params.accessory_category === 'HUB_RINGS' ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm text-gray-300">Внутрішній діаметр, мм</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.params.ring_inner_diameter}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, params: { ...prev.params, ring_inner_diameter: event.target.value } }))
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm text-gray-300">Зовнішній діаметр, мм</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.params.ring_outer_diameter}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, params: { ...prev.params, ring_outer_diameter: event.target.value } }))
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </label>
            </div>
          ) : null}

          {form.params.accessory_category === 'SPACERS' ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm text-gray-300">Тип проставки</span>
                <select
                  value={form.params.spacer_type}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      params: { ...prev.params, spacer_type: event.target.value as '' | SpacerType },
                    }))
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                >
                  <option value="">Оберіть тип</option>
                  {spacerTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm text-gray-300">Товщина, мм</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.params.spacer_thickness}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, params: { ...prev.params, spacer_thickness: event.target.value } }))
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </label>
            </div>
          ) : null}

          {form.params.accessory_category === 'TIRE_BAGS' ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm text-gray-300">Кількість у комплекті</span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.params.package_quantity}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, params: { ...prev.params, package_quantity: event.target.value } }))
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </label>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <label className="space-y-1">
              <span className="text-sm text-gray-300">{isRim ? 'Ширина J' : 'Ширина'}</span>
              <input
                type="number"
                min={0}
                step="0.1"
                value={form.params.width}
                onChange={(event) => setForm((prev) => ({ ...prev, params: { ...prev.params, width: event.target.value } }))}
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
              />
            </label>

            {isTire ? (
              <label className="space-y-1">
                <span className="text-sm text-gray-300">Профіль</span>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={form.params.profile}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, params: { ...prev.params, profile: event.target.value } }))
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </label>
            ) : (
              <div />
            )}

            <label className="space-y-1">
              <span className="text-sm text-gray-300">Радіус R</span>
              <input
                type="number"
                min={0}
                step="0.1"
                value={form.params.diameter}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, params: { ...prev.params, diameter: event.target.value } }))
                }
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
              />
            </label>

            {isTire ? (
              <label className="space-y-1">
                <span className="text-sm text-gray-300">Сезон</span>
                <select
                  value={form.params.season}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, params: { ...prev.params, season: event.target.value as '' | LotSeason } }))
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
            ) : (
              <div />
            )}
          </div>

          {isRim ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="space-y-1">
                <span className="text-sm text-gray-300">Сплав</span>
                <select
                  value={form.params.rim_material}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, params: { ...prev.params, rim_material: event.target.value as '' | RimMaterial } }))
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                >
                  <option value="">Не вказано</option>
                  {rimMaterialOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-sm text-gray-300">PCD</span>
                <input
                  type="text"
                  value={form.params.pcd}
                  onChange={(event) => setForm((prev) => ({ ...prev, params: { ...prev.params, pcd: event.target.value } }))}
                  placeholder="5x112"
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </label>
            </div>
          ) : null}

          {isRim ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm text-gray-300">DIA</span>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={form.params.dia}
                  onChange={(event) => setForm((prev) => ({ ...prev, params: { ...prev.params, dia: event.target.value } }))}
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm text-gray-300">ET</span>
                <input
                  type="number"
                  step="0.1"
                  value={form.params.et}
                  onChange={(event) => setForm((prev) => ({ ...prev, params: { ...prev.params, et: event.target.value } }))}
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                />
              </label>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm text-gray-300">Рік випуску</span>
              <input
                type="number"
                min={1900}
                max={2100}
                step={1}
                value={form.params.production_year}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, params: { ...prev.params, production_year: event.target.value } }))
                }
                className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
              />
            </label>

            <div className="space-y-1">
              <span className="text-sm text-gray-300">Країна виробник</span>
              <CountrySearchSelect
                value={form.params.country_of_origin}
                onChange={(value) => setForm((prev) => ({ ...prev, params: { ...prev.params, country_of_origin: value } }))}
                emptyLabel="Не вибрано"
                placeholder="Країна виробник"
              />
            </div>
          </div>

          {isTire ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className="space-y-1 sm:col-span-2">
                <span className="text-sm text-gray-300">Тип шини</span>
                <select
                  value={form.params.tire_terrain}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, params: { ...prev.params, tire_terrain: event.target.value as '' | TireTerrain } }))
                  }
                  className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-white outline-none focus:border-blue-500"
                >
                  <option value="">Не вказано</option>
                  {tireTerrainOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              {[
                ['is_run_flat', 'Run Flat'],
                ['is_spiked', 'Шипована'],
                ['is_c_type', 'Вантажна C'],
                ['anti_puncture', 'Антипрокол'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-200">
                  <input
                    type="checkbox"
                    checked={Boolean(form.params[key as keyof LotFormState['params']])}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        params: { ...prev.params, [key]: event.target.checked },
                      }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
