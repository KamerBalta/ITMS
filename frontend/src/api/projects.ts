import { apiClient } from './client';
import type { ProjectListItem, ProjectDetail } from '../types/project';

export const projectsApi = {
    getAll: () => apiClient.get<ProjectListItem[]>('/projects').then((res) => res.data),

    getById: (projectId: string) => apiClient.get<ProjectDetail>(`/projects/${projectId}`).then((res) => res.data),

    create: (data: { name: string; key: string; description?: string; ownerId?: string | null; teamIds: string[]; startDate?: string | null }) =>
        apiClient.post<{ id: string }>('/projects', data).then((res) => res.data),

    update: (projectId: string, data: { name: string; description?: string; startDate?: string | null; endDate?: string | null }) =>
        apiClient.put(`/projects/${projectId}`, data),

    archive: (projectId: string) => apiClient.delete(`/projects/${projectId}`),
    unarchive: (projectId: string) => apiClient.put(`/projects/${projectId}/unarchive`),

    addTeam: (projectId: string, teamId: string) =>
        apiClient.post<{ id: string }>(`/projects/${projectId}/teams/${teamId}`),

    removeTeam: (projectId: string, teamId: string) =>
        apiClient.delete(`/projects/${projectId}/teams/${teamId}`),
};