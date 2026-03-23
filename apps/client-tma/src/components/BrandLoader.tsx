type BrandLoaderProps = {
    message?: string;
    fullscreen?: boolean;
};

export const BrandLoader = ({ message = 'Завантаження каталогу...', fullscreen = false }: BrandLoaderProps) => {
    return (
        <div
            className={`flex flex-col items-center justify-center gap-4 ${
                fullscreen ? 'min-h-screen bg-gray-950 px-6' : 'rounded-3xl border border-gray-800 bg-gray-900/80 px-6 py-12'
            }`}
        >
            <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-[#10AD0B]/20 blur-md" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-[#10AD0B]/20 bg-gradient-to-br from-neutral-950 via-black to-black shadow-[0_0_40px_rgba(16,173,11,0.18)]">
                    <img src="/brand.png" alt="Логотип компанії" className="h-14 w-14 object-contain" />
                </div>
            </div>

            <div className="space-y-1 text-center">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#10AD0B]">Store Loading</p>
                <p className="text-sm text-gray-400">{message}</p>
            </div>

            <div className="h-1.5 w-32 overflow-hidden rounded-full bg-gray-800">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-gradient-to-r from-[#0b7d08] via-[#10AD0B] to-[#16d411]" />
            </div>
        </div>
    );
};
