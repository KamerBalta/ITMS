import { useEffect, type ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/auth';

export function AuthInitializer({ children }: { children: ReactNode }) {
    const { accessToken, isInitializing, setUser, setInitializing, logout } = useAuthStore();

    useEffect(() => {
        if (!accessToken) {
            setInitializing(false);
            return;
        }

        authApi
            .me()
            .then((user) => setUser(user))
            .catch(() => logout()) // token gecersizse (refresh de basarisizsa apiClient zaten logout tetikler) temizle
            .finally(() => setInitializing(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // yalnizca uygulama acilisinda bir kez calissin

    if (isInitializing) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-gray-500">Yükleniyor...</p>
            </div>
        );
    }

    return <>{children}</>;
}