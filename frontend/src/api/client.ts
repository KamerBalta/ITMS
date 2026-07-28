import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore, getStoredAccessToken, getStoredRefreshToken } from '../store/authStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5148/api/v1';

export const apiClient = axios.create({
    baseURL: BASE_URL,
});

// Istek interceptor: her istege JWT'yi otomatik ekle
apiClient.interceptors.request.use((config) => {
    const token = getStoredAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 401 alindiginda bekleyen istekleri kuyruklamak icin (ayni anda birden fazla istek
// 401 alirsa, hepsi icin ayri ayri refresh cagirmayi onluyoruz)
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(callback: (token: string) => void) {
    refreshSubscribers.push(callback);
}

function onRefreshed(token: string) {
    refreshSubscribers.forEach((callback) => callback(token));
    refreshSubscribers = [];
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
    _retry?: boolean;
}

// Yanit interceptor: 401 gelirse otomatik refresh dene, olmuyorsa logout et
apiClient.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as RetryableRequestConfig;

        if (error.response?.status !== 401 || originalRequest._retry || originalRequest.url?.includes('/auth/')) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            // Zaten bir refresh devam ediyorsa, o bitince bu istegi tekrar dene
            return new Promise((resolve) => {
                subscribeTokenRefresh((newToken) => {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    resolve(apiClient(originalRequest));
                });
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const refreshToken = getStoredRefreshToken();
            if (!refreshToken) throw new Error('Refresh token yok');

            const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });

            useAuthStore.getState().setTokens(data.accessToken, data.refreshToken);
            onRefreshed(data.accessToken);

            originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
            return apiClient(originalRequest);
        } catch (refreshError) {
            useAuthStore.getState().logout();
            window.location.href = '/login';
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);