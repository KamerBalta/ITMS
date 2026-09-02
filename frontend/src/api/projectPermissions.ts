import { apiClient } from './client';
import type { ProjectPermission } from '../types/projectPermission';

export const projectPermissionsApi = {
    getAll: (projectId: string) => apiClient.get<ProjectPermission[]>(`/projects/${projectId}/permissions`).then((res) => res.data),
    set: (projectId: string, key: string, isEnabled: boolean) =>
        apiClient.put(`/projects/${projectId}/permissions/${key}`, { isEnabled }),
};