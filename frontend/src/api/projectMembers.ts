import { apiClient } from './client';
import type { ProjectMemberItem } from '../types/projectMember';

export const projectMembersApi = {
    getByProject: (projectId: string) =>
        apiClient.get<ProjectMemberItem[]>(`/projects/${projectId}/members`).then((res) => res.data),

    add: (projectId: string, data: { teamId: string; userId: string; projectRole: number }) =>
        apiClient.post<{ id: string }>(`/projects/${projectId}/members`, data),

    remove: (projectId: string, memberId: string) =>
        apiClient.delete(`/projects/${projectId}/members/${memberId}`),
};