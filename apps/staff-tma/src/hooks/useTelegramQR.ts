// apps/staff-tma/src/hooks/useTelegramQR.ts
import { useCallback } from 'react';

export const useTelegramQR = () => {
    const scanQR = useCallback((onScan: (text: string) => void) => {
        // Звертаємося напряму до глобального об'єкта (оминаємо @twa-dev/sdk)
        const tg = (window as any).Telegram?.WebApp;

        // 1. Якщо tg взагалі немає, значить скрипт з index.html не завантажився
        if (!tg) {
            alert("Критична помилка: Об'єкт Telegram не знайдено! Переконайся, що оновив сторінку (Reload Page) в ТГ.");
            return;
        }

        // 2. Якщо скрипт є, перевіряємо платформу
        const platform = tg.platform || 'unknown';

        // Тимчасовий дебаг (потім приберемо)
        // alert(`Дебаг: Платформа = ${platform}, Версія SDK = ${tg.version}`);

        if (platform !== 'unknown') {

            // Перевіряємо, чи є функція сканера
            if (typeof tg.showScanQrPopup === 'function') {
                tg.showScanQrPopup(
                    { text: 'Наведіть камеру на QR-код лота' },
                    (result: string) => {
                        if (result) {
                            onScan(result);
                            return true; // Закриває сканер
                        }
                    }
                );
            } else {
                alert(`Ваш клієнт (${platform}) не підтримує сканер. Спробуйте оновити Telegram.`);
            }

        } else {
            // 3. Фолбек для браузера
            const fakeId = prompt(`Браузерний режим (${platform}). Введіть ID лота:`);
            if (fakeId) onScan(fakeId);
        }
    }, []);

    return { scanQR };
};