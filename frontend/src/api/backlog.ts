import { apiClient } from './client';

export interface BacklogTaskItem {
    id: string;
    title: string;
    issueType: string;
    priority: string;
    storyPoint: number | null;
    assigneeId: string | null;
    assigneeName: string | null;
    rank: number;
    parentTaskId: string | null;
    parentTaskTitle: string | null;
}

export const backlogApi = {
    get: (projectId: string, page = 1, pageSize = 25) =>
        apiClient.get<BacklogTaskItem[]>('/backlog', { params: { projectId, page, pageSize } }).then((res) => res.data),

    moveToSprint: (taskId: string, sprintId: string) =>
        apiClient.put(`/backlog/${taskId}/move-to-sprint`, { sprintId }),

    removeFromSprint: (taskId: string) => apiClient.put(`/backlog/${taskId}/remove-from-sprint`),
};