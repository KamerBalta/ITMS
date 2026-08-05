import { apiClient } from './client';
import type { UserDetail, UserListItem } from '../types/user';

export const usersApi = {
    getMyProfile: () => apiClient.get<UserDetail>('/users/me').then((res) => res.data),

    updateMyProfile: (data: { name: string; title?: string | null }) =>
        apiClient.put('/users/me', data),

    changeMyPassword: (data: { currentPassword: string; newPassword: string }) =>
        apiClient.put('/users/me/password', data),

    uploadAvatar: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post<{ avatarUrl: string }>('/users/me/avatar', formData).then((res) => res.data);
    },

    // Admin-only
    getAll: () => apiClient.get<UserListItem[]>('/users').then((res) => res.data),
};