import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Determine the base URL from environment variables or use a default local backend
const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://unknown-messaging-theta-permits.trycloudflare.com/api/v1';

export const apiClient = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request Interceptor: Attach the JWT token to every request if it exists
apiClient.interceptors.request.use(
    (config) => {
        // Get the current state of the auth store
        const token = useAuthStore.getState().token;

        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Handle global errors (e.g., 401 Unauthorized)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear store if the token is invalid or expired
            useAuthStore.getState().logout();
            // Additional logic like redirecting can be handled at the app level
        }
        return Promise.reject(error);
    }
);