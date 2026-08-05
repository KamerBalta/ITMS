import { apiClient } from './client';
import type { TeamListItem, TeamDetail } from '../types/team';

export const teamsApi = {
    getAll: () => apiClient.get<TeamListItem[]>('/teams').then((res) => res.data),

    getById: (teamId: string) => apiClient.get<TeamDetail>(`/teams/${teamId}`).then((res) => res.data),

    create: (data: { name: string; description?: string }) =>
        apiClient.post<{ id: string }>('/teams', data).then((res) => res.data),

    addMember: (teamId: string, data: { userId: string; teamRole: string }) =>
        apiClient.post(`/teams/${teamId}/members`, data),

    removeMember: (teamId: string, userId: string) =>
        apiClient.delete(`/teams/${teamId}/members/${userId}`),
    update: (teamId: string, data: { name: string; description?: string }) =>
        apiClient.put(`/teams/${teamId}`, data),

    delete: (teamId: string) => apiClient.delete(`/teams/${teamId}`),
};