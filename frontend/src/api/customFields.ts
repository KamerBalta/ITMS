import { apiClient } from './client';
import type { CustomFieldDefinition, TaskCustomFieldValue } from '../types/customField';

export const customFieldsApi = {
    getAll: (projectId: string) => apiClient.get<CustomFieldDefinition[]>(`/projects/${projectId}/custom-fields`).then((res) => res.data),
    create: (projectId: string, data: { name: string; fieldType: string; optionsJson?: string; isRequired: boolean }) =>
        apiClient.post(`/projects/${projectId}/custom-fields`, data),
    delete: (projectId: string, fieldId: string) => apiClient.delete(`/projects/${projectId}/custom-fields/${fieldId}`),
    getTaskValues: (taskId: string) => apiClient.get<TaskCustomFieldValue[]>(`/tasks/${taskId}/custom-fields`).then((res) => res.data),
    setTaskValue: (taskId: string, fieldId: string, value: string | null) =>
        apiClient.put(`/tasks/${taskId}/custom-fields/${fieldId}`, { value }),
};