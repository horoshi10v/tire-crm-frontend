type ConfirmDialogProps = {
    isOpen: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
};

export const ConfirmDialog = ({
    isOpen,
    title,
    description,
    confirmLabel = 'Так',
    cancelLabel = 'Ні',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) => {
    return (
        <div
            className={`fixed inset-0 z-[98] flex items-center justify-center px-4 transition-all duration-300 ease-out ${
                isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-modal="true"
            role="dialog"
        >
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />

            <div
                className={`relative w-full max-w-sm overflow-hidden rounded-[26px] border border-red-500/20 bg-[linear-gradient(180deg,rgba(24,8,8,0.96),rgba(16,8,8,0.98))] shadow-[0_24px_60px_rgba(0,0,0,0.42)] transition-all duration-300 ease-out ${
                    isOpen ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-[0.985] opacity-0'
                }`}
            >
                <button
                    type="button"
                    onClick={onCancel}
                    className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-lg text-white transition hover:bg-white/10"
                    aria-label="Закрити діалог"
                >
                    &times;
                </button>

                <div className="flex items-start gap-3 px-5 py-4">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-400">
                        !
                    </div>
                    <div className="min-w-0">
                        <p className="text-base font-semibold text-white">{title}</p>
                        {description ? <p className="mt-1 text-sm leading-5 text-gray-300">{description}</p> : null}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-white/8 px-5 py-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-400"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};
