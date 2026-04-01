type AnalyticsLineChartPoint = {
  label: string;
  value: number;
};

type AnalyticsLineChartProps = {
  current: AnalyticsLineChartPoint[];
  previous?: AnalyticsLineChartPoint[];
  currentStroke?: string;
  previousStroke?: string;
};

const buildPolyline = (points: AnalyticsLineChartPoint[], maxValue: number, width: number, height: number): string => {
  if (points.length === 0) {
    return '';
  }

  return points
    .map((point, index) => {
      const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
      const y = height - (point.value / maxValue) * height;
      return `${x},${y}`;
    })
    .join(' ');
};

export default function AnalyticsLineChart({
  current,
  previous = [],
  currentStroke = '#60a5fa',
  previousStroke = '#c4b5fd',
}: AnalyticsLineChartProps) {
  const width = 100;
  const height = 44;
  const maxValue = Math.max(
    1,
    ...current.map((point) => point.value),
    ...previous.map((point) => point.value)
  );
  const currentPolyline = buildPolyline(current, maxValue, width, height);
  const previousPolyline = buildPolyline(previous, maxValue, width, height);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
        {current.length === 0 ? (
          <p className="text-sm text-gray-400">Немає подій за вибраний період.</p>
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full overflow-visible">
            {[0, 1, 2, 3].map((step) => (
              <line
                key={step}
                x1="0"
                x2={width}
                y1={(height / 3) * step}
                y2={(height / 3) * step}
                className="stroke-gray-800"
                strokeWidth="0.35"
              />
            ))}
            {previousPolyline ? (
              <polyline
                fill="none"
                points={previousPolyline}
                stroke={previousStroke}
                strokeWidth="1.2"
                strokeDasharray="2 2"
              />
            ) : null}
            {currentPolyline ? (
              <polyline
                fill="none"
                points={currentPolyline}
                stroke={currentStroke}
                strokeWidth="2"
              />
            ) : null}
            {current.map((point, index) => {
              const cx = current.length === 1 ? width / 2 : (index / (current.length - 1)) * width;
              const cy = height - (point.value / maxValue) * height;
              return <circle key={`${point.label}-${index}`} cx={cx} cy={cy} r="1.7" className="fill-blue-300" />;
            })}
          </svg>
        )}
      </div>
      {current.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-6">
          {current.map((point) => (
            <div key={point.label} className="rounded-lg border border-gray-800 bg-gray-950 p-2">
              <p className="text-[11px] uppercase tracking-wide text-gray-500">{point.label}</p>
              <p className="mt-1 text-sm font-semibold text-white">{point.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
