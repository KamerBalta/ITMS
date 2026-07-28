import { apiClient } from './client';
import type { TaskListItem } from '../types/task';

export const backlogApi = {
    get: (projectId: string) =>
        apiClient.get<TaskListItem[]>('/backlog', { params: { projectId } }).then((res) => res.data),

    moveToSprint: (taskId: string, sprintId: string) =>
        apiClient.put(`/backlog/${taskId}/move-to-sprint`, { sprintId }),

    removeFromSprint: (taskId: string) => apiClient.put(`/backlog/${taskId}/remove-from-sprint`),
};