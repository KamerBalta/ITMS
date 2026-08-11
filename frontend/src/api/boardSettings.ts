import { apiClient } from './client';
import type { BoardColumnSetting } from '../types/boardSettings';

export const boardSettingsApi = {
    getAll: (projectId: string) =>
        apiClient.get<BoardColumnSetting[]>(`/projects/${projectId}/board-settings`).then((res) => res.data),
    updateWipLimit: (projectId: string, status: string, wipLimit: number | null) =>
        apiClient.put(`/projects/${projectId}/board-settings/${status}/wip-limit`, { wipLimit }),
};