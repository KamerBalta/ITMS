import { apiClient } from './client';
import type { ChangelogEntryItem } from '../types/changelog';

export const changelogApi = {
    getUnseen: () => apiClient.get<ChangelogEntryItem[]>('/changelog/unseen').then((res) => res.data),
    getAll: () => apiClient.get<ChangelogEntryItem[]>('/changelog').then((res) => res.data),
    markSeen: () => apiClient.post('/changelog/mark-seen'),
    create: (data: { title: string; description: string; category: string }) => apiClient.post('/changelog', data),
};