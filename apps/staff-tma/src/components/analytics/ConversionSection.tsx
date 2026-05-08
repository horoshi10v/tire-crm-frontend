import { formatPercent } from '../../utils/adminLotAnalytics';

interface ConversionPoint {
  date: string;
  conversionRate: number;
  conversionWidth: string;
}

interface ConversionSectionProps {
  periodLabel: string;
  rows: ConversionPoint[];
}

export default function ConversionSection({ periodLabel, rows }: ConversionSectionProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
        <div className="mb-3 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
          <p className="text-xs uppercase tracking-wider text-gray-400">
            Конверсія по {periodLabel}
          </p>
          <p className="text-[11px] text-gray-500">Замовлення / перегляди</p>
        </div>
        <p className="text-sm text-gray-400">Немає подій за вибраний період.</p>
      </div>
    );
  }

  // Групуємо послідовні однакові значення (наприклад, 0%), щоб не плодити дублі
  const groupedRows: { start: string; end: string; rate: number; width: string }[] = [];
  let currentGroup: { start: string; end: string; rate: number; width: string } | null = null;

  for (const row of rows) {
    if (!currentGroup) {
      currentGroup = { start: row.date, end: row.date, rate: row.conversionRate, width: row.conversionWidth };
    } else if (currentGroup.rate === row.conversionRate) {
      currentGroup.end = row.date;
    } else {
      groupedRows.push(currentGroup);
      currentGroup = { start: row.date, end: row.date, rate: row.conversionRate, width: row.conversionWidth };
    }
  }
  if (currentGroup) {
    groupedRows.push(currentGroup);
  }

  // Допоміжна функція для відображення короткої дати (ДД.ММ) замість довгої (РРРР-ММ-ДД)
  const formatShortDate = (dateStr: string) => {
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) return `${parts[2]}.${parts[1]}`;
    }
    return dateStr;
  };

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
      <div className="mb-3 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <p className="text-xs uppercase tracking-wider text-gray-400">
          Конверсія по {periodLabel}
        </p>
        <p className="text-[11px] text-gray-500">Замовлення / перегляди</p>
      </div>

      <div className="space-y-4 sm:space-y-2.5">
        {groupedRows.map((group, idx) => {
          const label =
            group.start === group.end
              ? formatShortDate(group.start)
              : `${formatShortDate(group.start)} - ${formatShortDate(group.end)}`;

          return (
            <div key={idx} className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
              <div className="text-xs text-gray-400 sm:w-[92px] shrink-0 font-medium">
                {label}
              </div>
              <div className="flex flex-1 items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-800 sm:h-3">
                  <div
                    className="h-full rounded-full bg-fuchsia-500 transition-all duration-500"
                    style={{ width: group.width }}
                  />
                </div>
                <span className="min-w-[48px] text-right text-xs font-semibold text-white sm:min-w-[56px]">
                  {formatPercent(group.rate)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

