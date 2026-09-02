import { apiClient } from './client';
import type { WorkflowStatus, WorkflowTransition } from '../types/workflow';

export const workflowApi = {
    getStatuses: (projectId: string, includeDraft = false) =>
        apiClient.get<WorkflowStatus[]>(`/projects/${projectId}/workflow-statuses`, { params: { includeDraft } }).then((res) => res.data),
    createStatus: (projectId: string, data: { name: string; category: string; color?: string }) =>
        apiClient.post(`/projects/${projectId}/workflow-statuses`, data),
    updateStatus: (projectId: string, statusId: string, data: { name: string; category: string; color?: string }) =>
        apiClient.put(`/projects/${projectId}/workflow-statuses/${statusId}`, data),
    deleteStatus: (projectId: string, statusId: string) => apiClient.delete(`/projects/${projectId}/workflow-statuses/${statusId}`),
    reorderStatuses: (projectId: string, orderedIds: string[]) =>
        apiClient.put(`/projects/${projectId}/workflow-statuses/reorder`, { orderedIds }),
    setInitial: (projectId: string, statusId: string) => apiClient.put(`/projects/${projectId}/workflow-statuses/${statusId}/set-initial`),
    setEpicCloseTarget: (projectId: string, statusId: string) => apiClient.put(`/projects/${projectId}/workflow-statuses/${statusId}/set-epic-close-target`),

    getTransitions: (projectId: string, includeDraft = false) =>
        apiClient.get<WorkflowTransition[]>(`/projects/${projectId}/workflow`, { params: { includeDraft } }).then((res) => res.data),
    createTransition: (projectId: string, data: { fromStatusId: string; toStatusId: string; allowedRoles: string[]; requireAssigneeSelf: boolean }) =>
        apiClient.post(`/projects/${projectId}/workflow`, data),
    updateTransition: (projectId: string, id: string, data: { allowedRoles: string[]; requireAssigneeSelf: boolean }) =>
        apiClient.put(`/projects/${projectId}/workflow/${id}`, data),
    deleteTransition: (projectId: string, id: string) => apiClient.delete(`/projects/${projectId}/workflow/${id}`),

    publish: (projectId: string) => apiClient.post(`/projects/${projectId}/workflow/publish`),
    hasUnpublishedChanges: (projectId: string) =>
        apiClient.get<{ hasChanges: boolean }>(`/projects/${projectId}/workflow/has-unpublished-changes`).then((res) => res.data.hasChanges),
};