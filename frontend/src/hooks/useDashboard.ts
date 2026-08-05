import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard';

export function useDashboardSummary(projectId: string | null) {
    return useQuery({
        queryKey: ['dashboard', 'summary', projectId],
        queryFn: () => dashboardApi.getSummary(projectId!),
        enabled: !!projectId, // projectId secilmeden istek atma
    });
}

export function useWorkload(projectId: string | null) {
    return useQuery({
        queryKey: ['dashboard', 'workload', projectId],
        queryFn: () => dashboardApi.getWorkload(projectId!),
        enabled: !!projectId,
    });
}