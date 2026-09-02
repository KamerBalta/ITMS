import { apiClient } from './client';
import type { AuditHistoryItem } from '../types/auditHistory';

export const auditHistoryApi = {
    getTaskHistory: (taskId: string) => apiClient.get<AuditHistoryItem[]>(`/audit-logs/tasks/${taskId}`).then((res) => res.data),
};