import { create } from 'zustand';
import type { CurrentUser } from '../types/auth';
import { queryClient } from '../lib/queryClient';
import { useProjectStore } from './projectStore';

const ACCESS_TOKEN_KEY = 'infera_access_token';
const REFRESH_TOKEN_KEY = 'infera_refresh_token';

interface AuthState {
    accessToken: string | null;
    refreshToken: string | null;
    user: CurrentUser | null;
    isAuthenticated: boolean;
    isInitializing: boolean;
    avatarRefreshKey: number;

    setTokens: (accessToken: string, refreshToken: string) => void;
    setUser: (user: CurrentUser) => void;
    refreshAvatar: () => void;
    setInitializing: (value: boolean) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: localStorage.getItem(ACCESS_TOKEN_KEY),
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
    user: null,
    isAuthenticated: !!localStorage.getItem(ACCESS_TOKEN_KEY),
    isInitializing: !!localStorage.getItem(ACCESS_TOKEN_KEY),
    avatarRefreshKey: 0,

    setTokens: (accessToken, refreshToken) => {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);

        set({
            accessToken,
            refreshToken,
            isAuthenticated: true,
        });
    },

    setUser: (user) => set({ user }),

    refreshAvatar: () =>
        set((state) => ({
            avatarRefreshKey: state.avatarRefreshKey + 1,
        })),

    setInitializing: (value) => set({ isInitializing: value }),

    logout: () => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);

        // React Query önbelleğini ve seçili proje state/storage verisini temizle
        queryClient.clear();
        useProjectStore.getState().clearSelectedProject();

        set({
            accessToken: null,
            refreshToken: null,
            user: null,
            isAuthenticated: false,
            isInitializing: false,
            avatarRefreshKey: 0,
        });
    },
}));

export const getStoredAccessToken = () =>
    localStorage.getItem(ACCESS_TOKEN_KEY);

export const getStoredRefreshToken = () =>
    localStorage.getItem(REFRESH_TOKEN_KEY);