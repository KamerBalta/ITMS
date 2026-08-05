import { apiClient } from './client';
import type { SettingItem } from '../types/setting';

export const settingsApi = {
    getAll: () => apiClient.get<SettingItem[]>('/settings').then((res) => res.data),
    upsert: (key: string, value: string) => apiClient.put<{ id: string }>('/settings', { key, value }),
    delete: (settingId: string) => apiClient.delete(`/settings/${settingId}`),
};