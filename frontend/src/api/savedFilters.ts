import { apiClient } from './client';
import type { SavedFilter } from '../types/savedFilter';

export const savedFiltersApi = {
    getAll: (projectId: string) =>
        apiClient.get<SavedFilter[]>(`/projects/${projectId}/saved-filters`).then((res) => res.data),
    create: (projectId: string, data: { name: string; filtersJson: string; isShared: boolean }) =>
        apiClient.post<{ id: string }>(`/projects/${projectId}/saved-filters`, data),
    delete: (projectId: string, filterId: string) =>
        apiClient.delete(`/projects/${projectId}/saved-filters/${filterId}`),
};