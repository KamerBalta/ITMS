import { apiClient } from './client';
import type { TaskListItem, TaskDetail, CreateTaskPayload, Priority } from '../types/task';

export const tasksApi = {
    getAll: (params: {
        projectId: string;
        sprintId?: string | null;
        backlogOnly?: boolean;
        assigneeId?: string;
        status?: string;
        issueTypeId?: string;
        priority?: number;
        search?: string;
        parentTaskId?: string;
        labelId?: string;
        page?: number;
        pageSize?: number;
    }) => apiClient.get<TaskListItem[]>('/tasks', { params }).then((res) => res.data),

    getById: (taskId: string) => apiClient.get<TaskDetail>(`/tasks/${taskId}`).then((res) => res.data),

    create: (data: CreateTaskPayload) =>
        apiClient.post<{ id: string }>('/tasks', data).then((res) => res.data),

    createSubtask: (parentTaskId: string, data: { title: string; assigneeId?: string | null }) =>
        apiClient.post<{ id: string }>(`/tasks/${parentTaskId}/subtasks`, data).then((res) => res.data),

    updateStatus: (taskId: string, status: number) => apiClient.put(`/tasks/${taskId}/status`, { status }),
    updateTitle: (taskId: string, title: string) => apiClient.put(`/tasks/${taskId}/title`, { title }),
    updateDescription: (taskId: string, description: string) =>
        apiClient.put(`/tasks/${taskId}/description`, { description }),
    updatePriority: (taskId: string, priority: Priority) => apiClient.put(`/tasks/${taskId}/priority`, { priority }),
    updateStoryPoint: (taskId: string, storyPoint: number | null) =>
        apiClient.put(`/tasks/${taskId}/story-point`, { storyPoint }),
    updateDueDate: (taskId: string, dueDate: string | null) => apiClient.put(`/tasks/${taskId}/due-date`, { dueDate }),
    updateRelease: (taskId: string, releaseId: string | null) => apiClient.put(`/tasks/${taskId}/release`, { releaseId }),
    reassign: (taskId: string, assigneeId: string | null) => apiClient.put(`/tasks/${taskId}/assignee`, { assigneeId }),
    closeEpic: (taskId: string) => apiClient.put(`/tasks/${taskId}/close-epic`),
};