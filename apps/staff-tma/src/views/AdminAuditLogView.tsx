import { useEffect, useMemo, useState } from 'react';
import { useAdminAuditLogs } from '../api/adminAuditLogs';

const formatDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat('uk-UA', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

const formatJson = (value?: Record<string, unknown>) => {
  if (!value || Object.keys(value).length === 0) {
    return 'Немає даних';
  }

  return JSON.stringify(value, null, 2);
};

const getPresetRange = (days: number) => {
  const today = new Date();
  const end = formatDateInput(today);

  if (days <= 1) {
    return { start: end, end };
  }

  const startDate = new Date(today);
  startDate.setDate(today.getDate() - (days - 1));

  return {
    start: formatDateInput(startDate),
    end,
  };
};

export default function AdminAuditLogView() {
  const pageSize = 20;
  const [page, setPage] = useState(1);
  const [entityInput, setEntityInput] = useState('');
  const [actionInput, setActionInput] = useState('');
  const [userInput, setUserInput] = useState('');
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');
  const [filters, setFilters] = useState({ entity: '', action: '', user: '', start_date: '', end_date: '' });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setFilters({
        entity: entityInput.trim(),
        action: actionInput.trim(),
        user: userInput.trim(),
        start_date: startDateInput,
        end_date: endDateInput,
      });
      setPage(1);
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [actionInput, endDateInput, entityInput, startDateInput, userInput]);

  const { data, isLoading, isError, isFetching } = useAdminAuditLogs({
    page,
    page_size: pageSize,
    entity: filters.entity || undefined,
    action: filters.action || undefined,
    user: filters.user || undefined,
    start_date: filters.start_date || undefined,
    end_date: filters.end_date || undefined,
  });

  const logs = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const uniqueEntities = useMemo(() => Array.from(new Set(logs.map((log) => log.entity))).sort(), [logs]);
  const uniqueActions = useMemo(() => Array.from(new Set(logs.map((log) => log.action))).sort(), [logs]);

  const applyPreset = (days: number) => {
    const range = getPresetRange(days);
    setStartDateInput(range.start);
    setEndDateInput(range.end);
    setPage(1);
  };

  return (
    <section className="space-y-4 p-4 text-white">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">Журнал дій</h2>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
        <label className="space-y-1">
          <span className="text-sm text-gray-300">Сутність</span>
          <input
            type="text"
            list="audit-entities"
            value={entityInput}
            onChange={(event) => setEntityInput(event.target.value)}
            placeholder="ORDER, LOT, TRANSFER..."
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-[#10AD0B]"
          />
          <datalist id="audit-entities">
            {uniqueEntities.map((entity) => (
              <option key={entity} value={entity} />
            ))}
          </datalist>
        </label>

        <label className="space-y-1">
          <span className="text-sm text-gray-300">Дія</span>
          <input
            type="text"
            list="audit-actions"
            value={actionInput}
            onChange={(event) => setActionInput(event.target.value)}
            placeholder="STATUS_CHANGED..."
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-[#10AD0B]"
          />
          <datalist id="audit-actions">
            {uniqueActions.map((action) => (
              <option key={action} value={action} />
            ))}
          </datalist>
        </label>

        <label className="space-y-1">
          <span className="text-sm text-gray-300">Користувач</span>
          <input
            type="text"
            value={userInput}
            onChange={(event) => setUserInput(event.target.value)}
            placeholder="username, ім'я, телефон"
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-[#10AD0B]"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm text-gray-300">Від дати</span>
          <input
            type="date"
            value={startDateInput}
            onChange={(event) => setStartDateInput(event.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-[#10AD0B]"
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm text-gray-300">До дати</span>
          <input
            type="date"
            value={endDateInput}
            onChange={(event) => setEndDateInput(event.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-[#10AD0B]"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-400">Швидкий період:</span>
        <button
          type="button"
          onClick={() => applyPreset(1)}
          className="rounded-full border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-white transition hover:border-[#10AD0B]/50 hover:bg-[#10AD0B]/10"
        >
          Сьогодні
        </button>
        <button
          type="button"
          onClick={() => applyPreset(7)}
          className="rounded-full border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-white transition hover:border-[#10AD0B]/50 hover:bg-[#10AD0B]/10"
        >
          7 днів
        </button>
        <button
          type="button"
          onClick={() => applyPreset(30)}
          className="rounded-full border border-gray-700 bg-gray-900 px-3 py-1.5 text-sm text-white transition hover:border-[#10AD0B]/50 hover:bg-[#10AD0B]/10"
        >
          30 днів
        </button>
        <button
          type="button"
          onClick={() => {
            setStartDateInput('');
            setEndDateInput('');
            setPage(1);
          }}
          className="rounded-full border border-transparent px-3 py-1.5 text-sm text-gray-400 transition hover:text-white"
        >
          Очистити
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-800 bg-gray-900 px-4 py-3">
        <p className="text-sm text-gray-300">
          Показано <span className="font-semibold text-white">{logs.length}</span> з{' '}
          <span className="font-semibold text-white">{total}</span> записів
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Назад
          </button>
          <span className="min-w-24 text-center text-sm text-gray-300">
            Сторінка {page} з {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Далі
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-400">Завантаження журналу дій...</div>
      ) : null}

      {isError ? (
        <div className="rounded-xl border border-red-800/60 bg-red-950/30 p-4 text-sm text-red-300">
          Не вдалося завантажити журнал дій.
        </div>
      ) : null}

      {!isLoading && !isError && logs.length === 0 ? (
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-4 text-sm text-gray-400">Записів не знайдено.</div>
      ) : null}

      <div className="space-y-3">
        {logs.map((log) => (
          <article key={log.id} className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-[#10AD0B]/25 bg-[#10AD0B]/10 px-2.5 py-1 text-xs font-semibold text-[#8ff38b]">
                    {log.entity}
                  </span>
                  <span className="rounded-full border border-gray-700 bg-gray-800 px-2.5 py-1 text-xs font-semibold text-gray-200">
                    {log.action}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold text-white">{log.user_label}</p>
                <p className="text-xs text-gray-500">{formatDate(log.created_at)}</p>
              </div>
              <p className="max-w-xs break-all text-right text-xs text-gray-500">{log.entity_id}</p>
            </div>

            {log.comment ? (
              <div className="mt-3 rounded-xl border border-gray-800 bg-gray-950 p-3 text-sm text-gray-300">
                {log.comment}
              </div>
            ) : null}

            <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Попереднє значення</p>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-gray-300">{formatJson(log.old_value)}</pre>
              </div>
              <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Нове значення</p>
                <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-gray-300">{formatJson(log.new_value)}</pre>
              </div>
            </div>
          </article>
        ))}
      </div>

      {isFetching && !isLoading ? <p className="text-xs text-gray-500">Оновлення журналу дій...</p> : null}
    </section>
  );
}
