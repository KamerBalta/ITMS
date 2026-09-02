import { apiClient } from './client';
import type { BoardColumnSetting } from '../types/boardSettings';

export const boardSettingsApi = {
    getAll: (projectId: string) =>
        apiClient.get<BoardColumnSetting[]>(`/projects/${projectId}/board-settings`).then((res) => res.data),
    updateWipLimit: (projectId: string, statusId: string, wipLimit: number | null) =>
        apiClient.put(`/projects/${projectId}/board-settings/${statusId}/wip-limit`, { wipLimit }),
};