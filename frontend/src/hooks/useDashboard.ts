import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard';

export function useDashboardSummary(projectId: string | null) {
    return useQuery({
        queryKey: ['dashboard', 'summary', projectId],
        queryFn: () => dashboardApi.getSummary(projectId!),
        enabled: !!projectId,
    });
}

export function useWorkload(projectId: string | null) {
    return useQuery({
        queryKey: ['dashboard', 'workload', projectId],
        queryFn: () => dashboardApi.getWorkload(projectId!),
        enabled: !!projectId,
    });
}

export function useVelocity(projectId: string | null) {
    return useQuery({
        queryKey: ['dashboard', 'velocity', projectId],
        queryFn: () => dashboardApi.getVelocity(projectId!),
        enabled: !!projectId,
    });
}

export function useBurndown(sprintId: string | null) {
    return useQuery({
        queryKey: ['dashboard', 'burndown', sprintId],
        queryFn: () => dashboardApi.getBurndown(sprintId!),
        enabled: !!sprintId,
    });
}