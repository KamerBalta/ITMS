import { apiClient } from './client';
import type { NotificationItem } from '../types/notification';
import type { NotificationPreference } from '../types/notification';

export const notificationsApi = {
    getAll: () => apiClient.get<NotificationItem[]>('/notifications').then((res) => res.data),
    markAsRead: (id: string) => apiClient.put(`/notifications/${id}/read`),
    markAllAsRead: () => apiClient.put('/notifications/read-all'),
    delete: (id: string) => apiClient.delete(`/notifications/${id}`),
};
export const notificationPreferencesApi = {
    getMine: () => apiClient.get<NotificationPreference[]>('/notification-preferences').then((res) => res.data),
    update: (type: string, inAppEnabled: boolean, emailEnabled: boolean, emailFrequency: string) =>
        apiClient.put(`/notification-preferences/${type}`, { inAppEnabled, emailEnabled, emailFrequency }),
};