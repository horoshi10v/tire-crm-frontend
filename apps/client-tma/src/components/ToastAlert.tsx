type ToastAlertProps = {
    isVisible: boolean;
    title: string;
    description?: string;
    variant?: 'success' | 'error';
    onClose?: () => void;
};

export const ToastAlert = ({ isVisible, title, description, variant = 'success', onClose }: ToastAlertProps) => {
    const isError = variant === 'error';

    return (
        <div
            className={`fixed inset-0 z-[95] flex items-center justify-center px-4 transition-all duration-300 ease-out ${
                isVisible ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-live="polite"
            aria-atomic="true"
        >
            <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />

            <div
                className={`relative w-full max-w-sm overflow-hidden rounded-[26px] border shadow-[0_24px_60px_rgba(0,0,0,0.42)] transition-all duration-300 ease-out ${
                    isVisible ? 'translate-y-0 scale-100 opacity-100' : 'translate-y-4 scale-[0.985] opacity-0'
                } ${
                    isError
                        ? 'border-red-500/20 bg-[linear-gradient(180deg,rgba(24,8,8,0.96),rgba(16,8,8,0.98))]'
                        : 'border-[#10AD0B]/25 bg-[linear-gradient(180deg,rgba(6,12,6,0.96),rgba(10,18,10,0.98))]'
                }`}
            >
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-lg text-white transition hover:bg-white/10"
                    aria-label="Закрити повідомлення"
                >
                    &times;
                </button>
                <div className="flex items-start gap-3 px-5 py-4">
                    <div
                        className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                            isError ? 'bg-red-500/15 text-red-400' : 'bg-[#10AD0B]/15 text-[#10AD0B]'
                        }`}
                    >
                        {isError ? '!' : '✓'}
                    </div>
                    <div className="min-w-0">
                        <p className="text-base font-semibold text-white">{title}</p>
                        {description ? (
                            <p className="mt-1 text-sm leading-5 text-gray-300">{description}</p>
                        ) : null}
                    </div>
                </div>
                <div className="h-1 w-full bg-white/5">
                    <div
                        className={`h-full transition-[width] duration-[1300ms] ease-linear ${
                            isError ? 'bg-red-500' : 'bg-[#10AD0B]'
                        } ${
                            isVisible ? 'w-0' : 'w-full'
                        }`}
                    />
                </div>
            </div>
        </div>
    );
};
