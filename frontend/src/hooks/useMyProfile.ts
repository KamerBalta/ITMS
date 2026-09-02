import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users';

export function useMyProfile() {
    return useQuery({ queryKey: ['myProfile'], queryFn: usersApi.getMyProfile });
}

export function useUpdateMyProfile() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: usersApi.updateMyProfile,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['myProfile'] }),
    });
}

export function useDeleteAvatar() {
    const qc = useQueryClient();

    return useMutation({
        mutationFn: usersApi.deleteAvatar,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['myProfile'] });
        },
    });
}

export function useChangeMyPassword() {
    return useMutation({ mutationFn: usersApi.changeMyPassword });
}

export function useUploadAvatar() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (file: File) => {
            const result = await usersApi.uploadAvatar(file);
            return result;
        },
        onSuccess: (_, __, ___) => {
            qc.invalidateQueries({ queryKey: ['myProfile'] });
        },
    });
}
export function useRevokeAllSessions() {
    return useMutation({ mutationFn: usersApi.revokeAllSessions });
}