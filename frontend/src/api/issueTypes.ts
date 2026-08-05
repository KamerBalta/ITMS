import { apiClient } from './client';
import type { GlobalIssueType } from '../types/issueType';

export interface IssueTypePayload {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    creatorTier: number;
    allowsChildren: boolean;
    requiresParent: boolean;
}

export const issueTypesApi = {
    getAll: (activeOnly = false) =>
        apiClient.get<GlobalIssueType[]>('/issue-types', { params: { activeOnly } }).then((res) => res.data),
    create: (data: IssueTypePayload) => apiClient.post('/issue-types', data),
    update: (id: string, data: IssueTypePayload) => apiClient.put(`/issue-types/${id}`, data),
    toggleActive: (id: string) => apiClient.put(`/issue-types/${id}/toggle-active`),
    delete: (id: string) => apiClient.delete(`/issue-types/${id}`),
};