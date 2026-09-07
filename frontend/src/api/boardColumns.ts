import { apiClient } from './client';
import type { BoardColumnItem, BoardColumnSetting } from '../types/boardColumn';

export const boardColumnsApi = {
    getAll: (boardId: string) =>
        apiClient.get<BoardColumnItem[]>(`/boards/${boardId}/columns`).then((res) => res.data),

    create: (boardId: string, name: string) =>
        apiClient.post<{ id: string }>(`/boards/${boardId}/columns`, { name }),

    update: (boardId: string, columnId: string, name: string) =>
        apiClient.put(`/boards/${boardId}/columns/${columnId}`, { name }),

    delete: (boardId: string, columnId: string) =>
        apiClient.delete(`/boards/${boardId}/columns/${columnId}`),

    reorder: (boardId: string, orderedIds: string[]) =>
        apiClient.put(`/boards/${boardId}/columns/reorder`, { orderedIds }),

    mapStatus: (boardId: string, statusId: string, columnId: string | null) =>
        apiClient.put(`/boards/${boardId}/columns/map-status`, { statusId, columnId }),

    getSettings: (boardId: string) =>
        apiClient.get<BoardColumnSetting[]>(`/boards/${boardId}/settings`).then((res) => res.data),

    updateWipLimit: (boardId: string, columnId: string, wipLimit: number | null) =>
        apiClient.put(`/boards/${boardId}/settings/${columnId}/wip-limit`, { wipLimit }),
};