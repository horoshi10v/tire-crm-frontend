type StatusBadgeProps = {
  label: string;
  tone?: 'neutral' | 'info' | 'success' | 'warning' | 'danger';
  className?: string;
};

const toneClasses: Record<NonNullable<StatusBadgeProps['tone']>, string> = {
  neutral: 'border-gray-700 bg-gray-800 text-gray-200',
  info: 'border-blue-700/40 bg-blue-900/20 text-blue-200',
  success: 'border-emerald-700/40 bg-emerald-900/20 text-emerald-200',
  warning: 'border-amber-700/40 bg-amber-900/20 text-amber-200',
  danger: 'border-red-700/40 bg-red-900/20 text-red-200',
};

export function StatusBadge({ label, tone = 'neutral', className = '' }: StatusBadgeProps) {
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${toneClasses[tone]} ${className}`}>
      {label}
    </span>
  );
}
