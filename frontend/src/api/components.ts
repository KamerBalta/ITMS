import { apiClient } from './client';

export interface ProjectComponentItem {
    id: string;
    projectId: string;
    name: string;
    description?: string | null;
    leadUserId?: string | null;
    leadUserName?: string | null;
    taskCount?: number;
}

export const componentsApi = {
    getAll: (projectId: string) => apiClient.get<ProjectComponentItem[]>(`/projects/${projectId}/components`).then((res) => res.data),
    create: (projectId: string, data: { name: string; description?: string; leadUserId?: string | null }) =>
        apiClient.post(`/projects/${projectId}/components`, data),
    update: (projectId: string, componentId: string, data: { name: string; description?: string; leadUserId?: string | null }) =>
        apiClient.put(`/projects/${projectId}/components/${componentId}`, data),
    delete: (projectId: string, componentId: string) => apiClient.delete(`/projects/${projectId}/components/${componentId}`),
    addToTask: (taskId: string, componentId: string) => apiClient.post(`/tasks/${taskId}/components/${componentId}`),
    removeFromTask: (taskId: string, componentId: string) => apiClient.delete(`/tasks/${taskId}/components/${componentId}`),
};