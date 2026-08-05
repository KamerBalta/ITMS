import { apiClient } from './client';
import type { SprintListItem, CreateSprintPayload } from '../types/sprint';

export const sprintsApi = {
    getAll: (projectId: string) =>
        apiClient.get<SprintListItem[]>('/sprints', { params: { projectId } }).then((res) => res.data),

    create: (data: CreateSprintPayload) =>
        apiClient.post<{ id: string }>('/sprints', data).then((res) => res.data),

    complete: (sprintId: string) => apiClient.put(`/sprints/${sprintId}/complete`),
};