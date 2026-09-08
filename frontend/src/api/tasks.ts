import { apiClient } from './client';
import type { TaskListItem, TaskDetail, CreateTaskPayload, Priority } from '../types/task';

export const tasksApi = {
    getAll: (params: {
        projectId: string;
        boardId?: string;
        sprintId?: string | null;
        backlogOnly?: boolean;
        assigneeId?: string;
        status?: string;
        statusId?: string; // Dinamik workflow filtresi için
        issueTypeId?: string;
        priority?: number;
        search?: string;
        parentTaskId?: string;
        labelId?: string;
        page?: number;
        componentId?: string;
        unassignedOnly?: boolean;
        pageSize?: number;
        reporterId?: string;
        createdAfter?: string;
        createdBefore?: string;
        dueDateAfter?: string;
        dueDateBefore?: string;
        updatedAfter?: string;
        updatedBefore?: string;
        overdueOnly?: boolean;
    }) => apiClient.get<TaskListItem[]>('/tasks', { params }).then((res) => res.data),

    getById: (taskId: string) => apiClient.get<TaskDetail>(`/tasks/${taskId}`).then((res) => res.data),

    resolveIssueKey: (issueKey: string) =>
        apiClient.get<{ taskId: string }>(`/tasks/resolve/${issueKey}`).then((res) => res.data.taskId),

    create: (data: CreateTaskPayload) =>
        apiClient.post<{ id: string }>('/tasks', data).then((res) => res.data),

    createSubtask: (parentTaskId: string, data: { title: string; assigneeId?: string | null }) =>
        apiClient.post<{ id: string }>(`/tasks/${parentTaskId}/subtasks`, data).then((res) => res.data),

    updateStatus: (taskId: string, statusId: string) =>
        apiClient.put(`/tasks/${taskId}/status`, { statusId }),

    updateTitle: (taskId: string, title: string) =>
        apiClient.put(`/tasks/${taskId}/title`, { title }),

    updateDescription: (taskId: string, description: string | null) =>
        apiClient.put(`/tasks/${taskId}/description`, { description }),

    updatePriority: (taskId: string, priority: Priority) =>
        apiClient.put(`/tasks/${taskId}/priority`, { priority }),

    updateStoryPoint: (taskId: string, storyPoint: number | null) =>
        apiClient.put(`/tasks/${taskId}/story-point`, { storyPoint }),

    updateDueDate: (taskId: string, dueDate: string | null) =>
        apiClient.put(`/tasks/${taskId}/due-date`, { dueDate }),

    updateRelease: (taskId: string, releaseId: string | null) =>
        apiClient.put(`/tasks/${taskId}/release`, { releaseId }),

    updateEstimates: (
        taskId: string,
        originalEstimateMinutes: number | null,
        remainingEstimateMinutes: number | null
    ) =>
        apiClient.put(`/tasks/${taskId}/estimates`, {
            originalEstimateMinutes,
            remainingEstimateMinutes,
        }),

    reassign: (taskId: string, assigneeId: string | null) =>
        apiClient.put(`/tasks/${taskId}/assignee`, { assigneeId }),

    closeEpic: (taskId: string) =>
        apiClient.put(`/tasks/${taskId}/close-epic`),

    findSimilar: (projectId: string, title: string) =>
        apiClient
            .get<
                {
                    id: string;
                    issueKey: string;
                    title: string;
                    statusName: string;
                    similarityScore: number;
                }[]
            >(`/tasks/projects/${projectId}/similar`, { params: { title } })
            .then((res) => res.data),
};