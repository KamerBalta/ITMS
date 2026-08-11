import { apiClient } from './client';
import type { WorkflowTransition } from '../types/workflow';

export const workflowApi = {
    getAll: (projectId: string) =>
        apiClient.get<WorkflowTransition[]>(`/projects/${projectId}/workflow`).then((res) => res.data),
    create: (projectId: string, data: { fromStatus: string; toStatus: string; allowedRoles: string[]; requireAssigneeSelf: boolean }) =>
        apiClient.post(`/projects/${projectId}/workflow`, data),
    update: (projectId: string, id: string, data: { allowedRoles: string[]; requireAssigneeSelf: boolean }) =>
        apiClient.put(`/projects/${projectId}/workflow/${id}`, data),
    delete: (projectId: string, id: string) => apiClient.delete(`/projects/${projectId}/workflow/${id}`),
};