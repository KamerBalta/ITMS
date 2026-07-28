import { apiClient } from './client';
import type { TaskListItem, TaskDetail, CreateTaskPayload } from '../types/task';

export const tasksApi = {
    getAll: (params: { projectId: string; sprintId?: string | null; backlogOnly?: boolean }) =>
        apiClient.get<TaskListItem[]>('/tasks', { params }).then((res) => res.data),

    getById: (taskId: string) => apiClient.get<TaskDetail>(`/tasks/${taskId}`).then((res) => res.data),

    create: (data: CreateTaskPayload) =>
        apiClient.post<{ id: string }>('/tasks', data).then((res) => res.data),

    updateStatus: (taskId: string, status: number) =>
        apiClient.put(`/tasks/${taskId}/status`, { status }),

    reassign: (taskId: string, assigneeId: string | null) =>
        apiClient.put(`/tasks/${taskId}/assignee`, { assigneeId }),
};