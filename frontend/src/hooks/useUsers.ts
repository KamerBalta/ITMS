import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../api/users';
import { useAuthStore } from '../store/authStore';

export function useAllUsers() {
    const isAdmin = useAuthStore((state) => state.user?.roles.includes('System Admin') ?? false);
    return useQuery({
        queryKey: ['users'],
        queryFn: usersApi.getAll,
        enabled: isAdmin, // Admin degilse API'yi hic cagirma -- zaten 403 donerdi
    });
}