import { apiClient } from './client';
import type { ReleaseItem } from '../types/release';

export const releasesApi = {
    getAll: (projectId: string) =>
        apiClient.get<ReleaseItem[]>('/releases', { params: { projectId } }).then((res) => res.data),

    create: (data: { projectId: string; version: string; releaseDate?: string | null; description?: string }) =>
        apiClient.post<{ id: string }>('/releases', data),

    update: (releaseId: string, data: { releaseDate?: string | null; description?: string }) =>
        apiClient.put(`/releases/${releaseId}`, data),

getTasksByRelease: (releaseId: string) =>
        apiClient.get<{ id: string; title: string; issueType: string; status: string }[]>(`/releases/${releaseId}/tasks`).then((res) => res.data),
};