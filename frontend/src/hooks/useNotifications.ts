import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    notificationsApi,
    notificationPreferencesApi,
} from '../api/notifications';
export function useNotifications() {
    return useQuery({
        queryKey: ['notifications'],
        queryFn: notificationsApi.getAll,
        refetchInterval: 30_000, // 30 saniyede bir otomatik yenile -- basit bir "polling" bildirim mekanizmasi
    });
}

export function useMarkAsRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => notificationsApi.markAsRead(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    });
}

export function useMarkAllAsRead() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: notificationsApi.markAllAsRead,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    });
}

export function useDeleteNotification() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => notificationsApi.delete(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    });
}

export function useNotificationPreferences() {
    return useQuery({ queryKey: ['notification-preferences'], queryFn: notificationPreferencesApi.getMine });
}

export function useUpdateNotificationPreference() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ type, inApp, email }: { type: string; inApp: boolean; email: boolean }) =>
            notificationPreferencesApi.update(type, inApp, email),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['notification-preferences'] }),
    });
}