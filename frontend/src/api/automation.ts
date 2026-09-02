import { apiClient } from './client';
import type { AutomationRule } from '../types/automation';

export const automationApi = {
    getAll: (projectId: string) => apiClient.get<AutomationRule[]>(`/projects/${projectId}/automation-rules`).then((res) => res.data),
    create: (projectId: string, data: { name: string; triggerType: string; triggerConditionJson?: string; actionType: string; actionParamsJson: string }) =>
        apiClient.post(`/projects/${projectId}/automation-rules`, data),
    toggle: (projectId: string, ruleId: string) => apiClient.put(`/projects/${projectId}/automation-rules/${ruleId}/toggle`),
    delete: (projectId: string, ruleId: string) => apiClient.delete(`/projects/${projectId}/automation-rules/${ruleId}`),
};