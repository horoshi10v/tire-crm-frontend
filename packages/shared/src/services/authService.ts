// packages/shared/src/services/authService.ts
import WebApp from '@twa-dev/sdk';
import { apiClient } from '../api/apiClient';
import type { AuthResponse } from '../types/auth';
import { useAuthStore } from '../store/useAuthStore';

export const authenticateTelegramUser = async (): Promise<void> => {
    try {
        // Retrieve initData string directly from the Telegram WebApp SDK
        const initData = WebApp.initData;

        if (!initData) {
            throw new Error('Telegram initData is missing. Are you running inside Telegram?');
        }

        // FIX: Match the Go backend JSON struct (init_data)
        const { data } = await apiClient.post<AuthResponse>('/auth/telegram', {
            init_data: initData,
        });

        // Save the retrieved JWT and user profile into the Zustand store
        useAuthStore.getState().setAuth(data.token, data.user);

        console.log('Successfully authenticated via Telegram!');
    } catch (error) {
        console.error('Telegram authentication failed:', error);
        throw error;
    }
};