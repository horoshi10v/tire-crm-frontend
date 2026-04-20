import type { ReactNode } from 'react';

type AsyncStateBlockProps = {
  children: ReactNode;
  tone?: 'neutral' | 'error';
  className?: string;
};

const toneClasses: Record<NonNullable<AsyncStateBlockProps['tone']>, string> = {
  neutral: 'border-gray-800 bg-gray-900 text-gray-400',
  error: 'border-red-800/60 bg-red-950/30 text-red-300',
};

export function AsyncStateBlock({ children, tone = 'neutral', className = '' }: AsyncStateBlockProps) {
  return (
    <div className={`rounded-xl border p-4 text-sm ${toneClasses[tone]} ${className}`}>
      {children}
    </div>
  );
}
