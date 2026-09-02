import { apiClient } from './client';
import type { IssueTemplateItem } from '../types/issueTemplate';

export const issueTemplatesApi = {
    getAll: (projectId: string) => apiClient.get<IssueTemplateItem[]>(`/projects/${projectId}/issue-templates`).then((res) => res.data),
    create: (projectId: string, data: { issueTypeId: string; name: string; descriptionTemplate?: string; defaultPriority?: number; isDefault: boolean }) =>
        apiClient.post(`/projects/${projectId}/issue-templates`, data),
    update: (projectId: string, id: string, data: { name: string; descriptionTemplate?: string; defaultPriority?: number; isDefault: boolean }) =>
        apiClient.put(`/projects/${projectId}/issue-templates/${id}`, data),
    delete: (projectId: string, id: string) => apiClient.delete(`/projects/${projectId}/issue-templates/${id}`),
};