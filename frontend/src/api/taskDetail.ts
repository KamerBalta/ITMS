import { apiClient } from './client';
import type {
    CommentItem,
    AttachmentItem,
    ChecklistSummary,
    WatcherItem,
    WorkLogSummary,
    LabelItem,
} from '../types/taskDetail';

export const commentsApi = {
    getAll: (taskId: string) => apiClient.get<CommentItem[]>(`/tasks/${taskId}/comments`).then((res) => res.data),
    add: (taskId: string, content: string) => apiClient.post(`/tasks/${taskId}/comments`, { content }),
    update: (taskId: string, commentId: string, content: string) =>
        apiClient.put(`/tasks/${taskId}/comments/${commentId}`, { content }),
    delete: (taskId: string, commentId: string) => apiClient.delete(`/tasks/${taskId}/comments/${commentId}`),
};

export const attachmentsApi = {
    getAll: (taskId: string) => apiClient.get<AttachmentItem[]>(`/tasks/${taskId}/attachments`).then((res) => res.data),
    upload: (taskId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post(`/tasks/${taskId}/attachments`, formData);
    },
    delete: (taskId: string, attachmentId: string) => apiClient.delete(`/tasks/${taskId}/attachments/${attachmentId}`),
    download: async (taskId: string, attachmentId: string) => {
        const response = await apiClient.get(
            `/tasks/${taskId}/attachments/${attachmentId}/download`,
            {
                responseType: 'blob',
            }
        );

        const blob = response.data;
        const disposition = response.headers['content-disposition'];
        let fileName = 'download';

        if (disposition) {
            const match = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/);
            if (match) {
                fileName = decodeURIComponent(match[1] || match[2]);
            }
        }

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },
};

export const checklistApi = {
    getAll: (taskId: string) => apiClient.get<ChecklistSummary>(`/tasks/${taskId}/checklist`).then((res) => res.data),
    add: (taskId: string, itemText: string) => apiClient.post(`/tasks/${taskId}/checklist`, { itemText }),
    toggle: (taskId: string, itemId: string) => apiClient.put(`/tasks/${taskId}/checklist/${itemId}/toggle`),
    delete: (taskId: string, itemId: string) => apiClient.delete(`/tasks/${taskId}/checklist/${itemId}`),
};

export const watchersApi = {
    getAll: (taskId: string) => apiClient.get<WatcherItem[]>(`/tasks/${taskId}/watchers`).then((res) => res.data),
    add: (taskId: string) => apiClient.post(`/tasks/${taskId}/watchers`),
    remove: (taskId: string) => apiClient.delete(`/tasks/${taskId}/watchers`),
};

export const workLogsApi = {
    getAll: (taskId: string) => apiClient.get<WorkLogSummary>(`/tasks/${taskId}/worklogs`).then((res) => res.data),
    add: (taskId: string, timeSpentMinutes: number, description?: string) =>
        apiClient.post(`/tasks/${taskId}/worklogs`, { timeSpentMinutes, description }),
    delete: (taskId: string, workLogId: string) => apiClient.delete(`/tasks/${taskId}/worklogs/${workLogId}`),
};

export const labelsApi = {
    getAll: () => apiClient.get<LabelItem[]>('/labels').then((res) => res.data),
    create: (data: { name: string; color?: string }) => apiClient.post('/labels', data),
    addToTask: (taskId: string, labelId: string) => apiClient.post(`/tasks/${taskId}/labels/${labelId}`),
    removeFromTask: (taskId: string, labelId: string) => apiClient.delete(`/tasks/${taskId}/labels/${labelId}`),
};