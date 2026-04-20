import type { ReactNode } from 'react';

type ModalShellProps = {
  title?: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  headerRight?: ReactNode;
};

export function ModalShell({
  title,
  onClose,
  children,
  className = '',
  contentClassName = '',
  headerRight,
}: ModalShellProps) {
  return (
    <div className={`fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-4 sm:items-center ${className}`}>
      <div className={`w-full max-w-2xl rounded-2xl border border-gray-800 bg-gray-900 shadow-2xl ${contentClassName}`}>
        <div className="flex items-center justify-between gap-3 border-b border-gray-800 px-4 py-3">
          <div>{title ? <h3 className="text-lg font-semibold text-white">{title}</h3> : null}</div>
          <div className="flex items-center gap-2">
            {headerRight}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2 py-1 text-sm text-gray-400 transition hover:bg-gray-800 hover:text-gray-200"
            >
              Закрити
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}
