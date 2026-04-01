type MetricComparisonCardProps = {
  title: string;
  current: string;
  previous?: string;
  delta?: string;
  deltaTone?: string;
  className?: string;
  titleClassName?: string;
  compact?: boolean;
};

export default function MetricComparisonCard({
  title,
  current,
  previous,
  delta,
  deltaTone = 'text-gray-300',
  className = 'rounded-xl border border-gray-800 bg-gray-950 p-3',
  titleClassName = 'text-xs uppercase tracking-wide text-gray-500',
  compact = false,
}: MetricComparisonCardProps) {
  return (
    <div className={className}>
      <p className={titleClassName}>{title}</p>
      <p className={`mt-2 font-bold text-white ${compact ? 'text-lg' : 'text-xl'}`}>{current}</p>
      {previous ? <p className="mt-1 text-xs text-gray-400">Було: {previous}</p> : null}
      {delta ? <p className={`mt-1 text-xs font-semibold ${deltaTone}`}>{delta}</p> : null}
    </div>
  );
}
