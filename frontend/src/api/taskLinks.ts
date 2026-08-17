import { apiClient } from './client';
import type { TaskLinkItem } from '../types/taskLink';

export const taskLinksApi = {
    getAll: (taskId: string) => apiClient.get<TaskLinkItem[]>(`/tasks/${taskId}/links`).then((res) => res.data),
    create: (taskId: string, targetTaskId: string, linkType: string) =>
        apiClient.post(`/tasks/${taskId}/links`, { targetTaskId, linkType }),
    delete: (taskId: string, linkId: string) => apiClient.delete(`/tasks/${taskId}/links/${linkId}`),
};