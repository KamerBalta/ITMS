import { apiClient } from './client';
import type { ProjectIssueType } from '../types/projectIssueType';

export const projectIssueTypesApi = {
    getAll: (projectId: string) =>
        apiClient.get<ProjectIssueType[]>(`/projects/${projectId}/issue-types`).then((res) => res.data),
    assign: (projectId: string, issueTypeId: string) =>
        apiClient.post(`/projects/${projectId}/issue-types`, { issueTypeId }),
    remove: (projectId: string, issueTypeId: string) =>
        apiClient.delete(`/projects/${projectId}/issue-types/${issueTypeId}`),
    reorder: (projectId: string, orderedIssueTypeIds: string[]) =>
        apiClient.put(`/projects/${projectId}/issue-types/reorder`, { orderedIssueTypeIds }),
};