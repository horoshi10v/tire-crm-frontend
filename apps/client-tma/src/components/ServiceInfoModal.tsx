import { useEffect, useState } from 'react';

type ServiceInfoModalProps = {
    isOpen: boolean;
    onClose: () => void;
};

export const ServiceInfoModal = ({ isOpen, onClose }: ServiceInfoModalProps) => {
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        let timeoutId: number | undefined;
        let frameId: number | undefined;

        if (isOpen) {
            setShouldRender(true);
            frameId = window.requestAnimationFrame(() => {
                timeoutId = window.setTimeout(() => {
                    setIsVisible(true);
                }, 28);
            });

            return () => {
                if (frameId) {
                    window.cancelAnimationFrame(frameId);
                }
                if (timeoutId) {
                    window.clearTimeout(timeoutId);
                }
            };
        }

        setIsVisible(false);
        timeoutId = window.setTimeout(() => {
            setShouldRender(false);
        }, 420);

        return () => {
            if (timeoutId) {
                window.clearTimeout(timeoutId);
            }
        };
    }, [isOpen]);

    useEffect(() => {
        if (!shouldRender) {
            return;
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleEscape);

        return () => {
            window.removeEventListener('keydown', handleEscape);
        };
    }, [onClose, shouldRender]);

    if (!shouldRender) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-end p-3 backdrop-blur-sm transition-[background-color,opacity] duration-[520ms] ease-[cubic-bezier(0.16,1,0.3,1)] sm:items-center sm:justify-center sm:p-4"
            style={{
                opacity: isVisible ? 1 : 0,
                backgroundColor: isVisible ? 'rgba(0, 0, 0, 0.72)' : 'rgba(0, 0, 0, 0)',
            }}
        >
            <button
                type="button"
                aria-label="Закрити інформацію про сервіс"
                className="absolute inset-0 cursor-default"
                onClick={onClose}
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="service-info-title"
                className="relative flex w-full max-w-md flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,_rgba(8,8,8,0.98),_rgba(14,14,14,0.98))] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.48)] will-change-transform sm:max-h-[min(92vh,860px)] lg:max-w-[860px]"
                style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0px) scale(1)' : 'translateY(72px) scale(0.975)',
                    transitionProperty: 'transform, opacity',
                    transitionDuration: isVisible ? '620ms' : '360ms',
                    transitionTimingFunction: isVisible
                        ? 'cubic-bezier(0.22, 1, 0.36, 1)'
                        : 'cubic-bezier(0.4, 0, 1, 1)',
                    transitionDelay: isVisible ? '120ms' : '0ms',
                }}
            >
                <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[#10AD0B]/10 blur-3xl" />

                <div className="relative">
                    <p className="text-center text-xs font-semibold uppercase tracking-[0.28em] text-[#10AD0B]">
                        Інформація про сервіс
                    </p>
                    <h2 id="service-info-title" className="sr-only">
                        Інформація про сервіс ДП Шина
                    </h2>
                    <div className="mx-auto mt-4 w-full max-w-[260px]">
                        <div className="relative aspect-[1540/296] w-full">
                            <img
                                src="/brand.png"
                                alt="Логотип компанії"
                                className="h-full w-full object-contain object-center"
                            />
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl text-white transition hover:bg-white/10"
                        aria-label="Закрити"
                    >
                        &times;
                    </button>
                </div>

                <div className="relative mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
                    <p className="text-sm leading-6 text-gray-300">
                        Сервіс для швидкого підбору шин і дисків у Telegram. Ви можете переглянути актуальні позиції,
                        оформити замовлення та напряму зв&apos;язатися з нашою командою.
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                        <a
                            href="tel:+380933904949"
                            className="group rounded-2xl border border-[#10AD0B]/25 bg-[#10AD0B]/10 p-4 transition hover:border-[#10AD0B]/45 hover:bg-[#10AD0B]/14 lg:min-h-[188px]"
                        >
                            <div className="flex items-start justify-between gap-3 lg:h-full lg:items-center">
                                <div className="min-w-0 lg:flex lg:flex-1 lg:flex-col lg:items-center lg:text-center">
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#10AD0B] lg:text-center">
                                        Зателефонувати
                                    </p>
                                    <p className="mt-2 text-lg font-bold text-white lg:text-center">
                                        +380 93 390 49 49
                                    </p>
                                    <p className="mt-1 text-sm text-gray-400 lg:max-w-[280px] lg:text-center">
                                        Швидкий зв&apos;язок для уточнення наявності та деталей замовлення.
                                    </p>
                                </div>
                                <span className="mt-0.5 text-xl text-white transition group-hover:text-[#10AD0B]">
                                    ↗
                                </span>
                            </div>
                        </a>

                        <a
                            href="https://maps.app.goo.gl/cyXH1hMQEMF6VFZz9?g_st=ac"
                            target="_blank"
                            rel="noreferrer"
                            className="group rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-[#10AD0B]/35 hover:bg-white/8 lg:min-h-[188px]"
                        >
                            <div className="flex items-start justify-between gap-3 lg:h-full lg:items-center">
                                <div className="min-w-0 lg:flex lg:flex-1 lg:flex-col lg:items-center lg:text-center">
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#10AD0B] lg:text-center">
                                        Відкрити маршрут
                                    </p>
                                    <p className="mt-2 text-base font-bold text-white lg:text-center">
                                        м. Дніпро, вул. Ічкерійська 49
                                    </p>
                                    <p className="mt-1 text-sm text-gray-400 lg:max-w-[280px] lg:text-center">
                                        Перехід у Google Maps для побудови маршруту до сервісу.
                                    </p>
                                </div>
                                <span className="mt-0.5 text-xl text-white transition group-hover:text-[#10AD0B]">
                                    ↗
                                </span>
                            </div>
                        </a>

                        <a
                            href="https://t.me/dpshina"
                            target="_blank"
                            rel="noreferrer"
                            className="group rounded-2xl border border-[#10AD0B]/25 bg-[#10AD0B]/10 p-4 transition hover:border-[#10AD0B]/45 hover:bg-[#10AD0B]/14 lg:min-h-[188px] lg:border-white/10 lg:bg-white/5 lg:hover:border-[#10AD0B]/35 lg:hover:bg-white/8"
                        >
                            <div className="flex items-start justify-between gap-3 lg:h-full lg:items-center">
                                <div className="min-w-0 lg:flex lg:flex-1 lg:flex-col lg:items-center lg:text-center">
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#10AD0B] lg:text-center">
                                        Написати в Telegram
                                    </p>
                                    <p className="mt-2 text-base font-bold text-white lg:text-center">
                                        @dpshina
                                    </p>
                                    <p className="mt-1 text-sm text-gray-400 lg:max-w-[280px] lg:text-center">
                                        Швидкий зв&apos;язок у Telegram для консультації та уточнення деталей.
                                    </p>
                                </div>
                                <span className="mt-0.5 text-xl text-white transition group-hover:text-[#10AD0B]">
                                    ↗
                                </span>
                            </div>
                        </a>

                        <a
                            href="https://t.me/shina_dp_shop_bot"
                            target="_blank"
                            rel="noreferrer"
                            className="group rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-[#10AD0B]/35 hover:bg-white/8 lg:min-h-[188px] lg:border-[#10AD0B]/25 lg:bg-[#10AD0B]/10 lg:hover:border-[#10AD0B]/45 lg:hover:bg-[#10AD0B]/14"
                        >
                            <div className="flex items-start justify-between gap-3 lg:h-full lg:items-center">
                                <div className="min-w-0 lg:flex lg:flex-1 lg:flex-col lg:items-center lg:text-center">
                                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#10AD0B] lg:text-center">
                                        Перейти в Telegram-бот
                                    </p>
                                    <p className="mt-2 text-base font-bold text-white lg:text-center">
                                        @shina_dp_shop_bot
                                    </p>
                                    <p className="mt-1 text-sm text-gray-400 lg:max-w-[280px] lg:text-center">
                                        Перехід у бот для перегляду товарів і оформлення замовлення через Telegram.
                                    </p>
                                </div>
                                <span className="mt-0.5 text-xl text-white transition group-hover:text-[#10AD0B]">
                                    ↗
                                </span>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};
