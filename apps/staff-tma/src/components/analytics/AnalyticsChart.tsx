import { ResponsiveLine } from '@nivo/line';

interface ChartSerie {
  id: string;
  data: Array<{
    x: string;
    y: number;
  }>;
}

interface AnalyticsChartProps {
  data: ChartSerie[];
  hasPreviousPeriod: boolean;
}

export default function AnalyticsChart({ data, hasPreviousPeriod }: AnalyticsChartProps) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-950 p-3">
      <div className="mb-3 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <p className="text-xs uppercase tracking-wider text-gray-400">Лінійний графік переглядів</p>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
            Поточний період
          </span>
          {hasPreviousPeriod ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-6 rounded-full bg-violet-300" />
              Попередній період
            </span>
          ) : null}
        </div>
      </div>
      <div style={{ height: '400px' }}>
        <ResponsiveLine
          data={data}
          margin={{ top: 50, right: 20, bottom: 70, left: 50 }}
          xScale={{ type: 'point' }}
          yScale={{
            type: 'linear',
            min: 'auto',
            max: 'auto',
            stacked: false,
            reverse: false,
          }}
          yFormat="d"
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            format: (value) => {
              if (typeof value === 'string' && value.includes('-')) {
                const parts = value.split('-');
                if (parts.length === 3) return `${parts[2]}.${parts[1]}`;
              }
              return value;
            },
            legend: 'Дата',
            legendOffset: 55,
            legendPosition: 'middle',
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Кількість',
            legendOffset: -40,
            legendPosition: 'middle',
          }}
          theme={{
            background: 'transparent',
            text: {
              fill: '#a1a1aa',
            },
            axis: {
              domain: { line: { stroke: '#3f3f46' } },
              ticks: { text: { fill: '#d4d4d8' } },
              legend: { text: { fill: '#a1a1aa', fontSize: 12 } },
            },
            grid: { line: { stroke: '#3f3f46', strokeDasharray: '4 4' } },
            tooltip: {
              container: { background: '#18181b', color: '#ffffff', border: '1px solid #3f3f46' },
            },
          }}
          colors={['#42a5f5', '#ab47bc']}
          pointSize={8}
          pointColor={{ theme: 'background' }}
          pointBorderWidth={2}
          pointBorderColor={{ from: 'serieColor' }}
          useMesh={true}
          tooltip={({ point }) => (
            <div className="min-w-[140px] rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-white shadow-xl">
              <div className="mb-1.5 border-b border-zinc-800 pb-1.5 font-semibold" style={{ color: point.seriesColor }}>
                {point.seriesId}
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-zinc-400">Дата:</span>
                  <span className="whitespace-nowrap font-medium">{point.data.xFormatted}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-zinc-400">Кількість:</span>
                  <span className="whitespace-nowrap font-bold">{Number(point.data.y)}</span>
                </div>
              </div>
            </div>
          )}
          legends={
            hasPreviousPeriod
              ? [
                  {
                    anchor: 'top-left',
                    direction: 'row',
                    justify: false,
                    translateX: 0,
                    translateY: -40,
                    itemsSpacing: 0,
                    itemDirection: 'left-to-right',
                    itemWidth: 80,
                    itemHeight: 20,
                    itemOpacity: 0.75,
                    symbolSize: 12,
                    symbolShape: 'circle',
                    symbolBorderColor: 'rgba(0, 0, 0, .5)',
                    effects: [
                      {
                        on: 'hover',
                        style: {
                          itemBackground: 'rgba(0, 0, 0, .03)',
                          itemOpacity: 1,
                        },
                      },
                    ],
                  },
                ]
              : []
          }
        />
      </div>
    </div>
  );
}
