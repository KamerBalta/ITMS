import { apiClient } from './client';
import type { RetrospectiveNote, RetroCategory } from '../types/retrospective';

export const retrospectiveApi = {
    getAll: (sprintId: string) =>
        apiClient.get<RetrospectiveNote[]>(`/sprints/${sprintId}/retrospective`).then((res) => res.data),

    add: (sprintId: string, category: RetroCategory, content: string) =>
        apiClient.post(`/sprints/${sprintId}/retrospective`, { category, content }),

    toggle: (sprintId: string, noteId: string) =>
        apiClient.put(`/sprints/${sprintId}/retrospective/${noteId}/toggle`),
};