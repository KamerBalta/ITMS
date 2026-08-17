import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users';
import { useAuthStore } from '../store/authStore';

export function useAllUsers() {
    const isAdmin = useAuthStore(
        (state) => state.user?.roles.includes('System Admin') ?? false
    );

    return useQuery({
        queryKey: ['users'],
        queryFn: usersApi.getAll,
        enabled: isAdmin,
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: usersApi.create,

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['users'],
            });
        },
    });
}

// Kullanıcı pasifleştirme
export function useDeactivateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: string) => usersApi.deactivate(userId),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['users'],
            });
        },
    });
}

// Kullanıcı aktifleştirme
export function useActivateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: string) => usersApi.activate(userId),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['users'],
            });
        },
    });
}

// Kullanıcı güncelleme (Ad, Ünvan)
export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            userId,
            data,
        }: {
            userId: string;
            data: {
                name?: string;
                title?: string | null;
            };
        }) => usersApi.update(userId, data),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['users'],
            });
        },
    });
}

// Kullanıcı rolü güncelleme
export function useUpdateUserRole() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            userId,
            roleName,
        }: {
            userId: string;
            roleName: string;
        }) => usersApi.updateRole(userId, roleName),

        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: ['users'],
            });
        },
    });
}

export function useUserDetail(userId: string | null) {
    return useQuery({
        queryKey: ['user-detail', userId],
        queryFn: () => usersApi.getById(userId!),
        enabled: !!userId,
        retry: false,
    });
}