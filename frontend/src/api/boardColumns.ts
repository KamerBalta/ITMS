import { apiClient } from './client';
import type { BoardColumnItem, BoardColumnSetting } from '../types/boardColumn';

export const boardColumnsApi = {
    getAll: (projectId: string) => apiClient.get<BoardColumnItem[]>(`/projects/${projectId}/board-columns`).then((res) => res.data),
    create: (projectId: string, name: string) => apiClient.post<{ id: string }>(`/projects/${projectId}/board-columns`, { name }),
    update: (projectId: string, columnId: string, name: string) => apiClient.put(`/projects/${projectId}/board-columns/${columnId}`, { name }),
    delete: (projectId: string, columnId: string) => apiClient.delete(`/projects/${projectId}/board-columns/${columnId}`),
    reorder: (projectId: string, orderedIds: string[]) => apiClient.put(`/projects/${projectId}/board-columns/reorder`, { orderedIds }),
    mapStatus: (projectId: string, statusId: string, columnId: string | null) => apiClient.put(`/projects/${projectId}/board-columns/map-status`, { statusId, columnId }),

    getSettings: (projectId: string) => apiClient.get<BoardColumnSetting[]>(`/projects/${projectId}/board-settings`).then((res) => res.data),
    updateWipLimit: (projectId: string, columnId: string, wipLimit: number | null) =>
        apiClient.put(`/projects/${projectId}/board-settings/${columnId}/wip-limit`, { wipLimit }),
};