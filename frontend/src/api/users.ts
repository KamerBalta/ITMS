import { apiClient } from './client';
import type { UserDetail, UserListItem } from '../types/user';

export const usersApi = {
    getMyProfile: () =>
        apiClient.get<UserDetail>('/users/me').then((res) => res.data),

    updateMyProfile: (data: { name: string; title?: string | null }) =>
        apiClient.put('/users/me', data),

    changeMyPassword: (data: { currentPassword: string; newPassword: string }) =>
        apiClient.put('/users/me/password', data),

    create: (data: {
        name: string;
        email: string;
        title?: string;
        projectId?: string | null;
        teamId?: string | null;
        projectRole?: number | null;
        teamRole?: string | null
    }) =>
        apiClient.post<{ id: string }>('/users', data).then((res) => res.data),

    uploadAvatar: (file: File) => {
        const formData = new FormData();
        formData.append('file', file);

        return apiClient
            .post<{ avatarUrl: string }>('/users/me/avatar', formData)
            .then((res) => res.data);
    },
    deleteAvatar: () =>
        apiClient.delete('/users/me/avatar'),


    // Admin-only
    getAll: () =>
        apiClient.get<UserListItem[]>('/users')
            .then((res) => res.data),

    getById: (userId: string) => apiClient.get<UserFullDetail>(`/users/${userId}`).then((res) => res.data),


    // 1) Kullanıcı detay getir
    getById: (userId: string) =>
        apiClient
            .get<UserDetail>(`/users/${userId}`)
            .then((res) => res.data),


    // 2) Kullanıcı düzenle
    update: (
        userId: string,
        data: {
            name?: string;
            title?: string | null;
        }
    ) =>
        apiClient.put(`/users/${userId}`, data),


    // 3) Kullanıcı pasifleştir
    deactivate: (userId: string) =>
        apiClient.put(`/users/${userId}/deactivate`),

    // 4) Kullanıcı aktifleştir
    activate: (userId: string) =>
        apiClient.put(`/users/${userId}/activate`),

    // 5) Kullanıcı rol güncelle
    updateRole: (
        userId: string,
        roleName: string
    ) =>
        apiClient.put(`/users/${userId}/role`, {
            roleName,
        }),
};