import { apiClient } from './client';
import type { BoardItem } from '../types/board';

export const boardsApi = {
    getAll: (projectId: string) => apiClient.get<BoardItem[]>(`/projects/${projectId}/boards`).then((res) => res.data),
    create: (projectId: string, name: string, boardType: string) =>
        apiClient.post<{ id: string }>(`/projects/${projectId}/boards`, { name, boardType }),
    update: (projectId: string, boardId: string, name: string) => apiClient.put(`/projects/${projectId}/boards/${boardId}`, { name }),
    delete: (projectId: string, boardId: string) => apiClient.delete(`/projects/${projectId}/boards/${boardId}`),
};