import { useQuery } from '@tanstack/react-query';
import { auditHistoryApi } from '../api/auditHistory';

export function useTaskAuditHistory(taskId: string) {
    return useQuery({ queryKey: ['audit-history', taskId], queryFn: () => auditHistoryApi.getTaskHistory(taskId) });
}