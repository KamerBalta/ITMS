import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardWidgetsApi } from '../api/dashboardWidgets';
import type { WidgetType } from '../types/dashboardWidget';

function invalidate(qc: ReturnType<typeof useQueryClient>, projectId: string) {
    qc.invalidateQueries({ queryKey: ['dashboard-widgets', projectId] });
}

export function useDashboardWidgets(projectId: string | null) {
    return useQuery({
        queryKey: ['dashboard-widgets', projectId],
        queryFn: () => dashboardWidgetsApi.getAll(projectId!),
        enabled: !!projectId,
    });
}
export function useAddDashboardWidget(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ widgetType, title, width }: { widgetType: WidgetType; title?: string; width: number }) =>
            dashboardWidgetsApi.add(projectId, widgetType, title, width),
        onSuccess: () => invalidate(qc, projectId),
    });
}
export function useUpdateDashboardWidget(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, title, width }: { id: string; title: string | null; width: number }) => dashboardWidgetsApi.update(projectId, id, title, width),
        onSuccess: () => invalidate(qc, projectId),
    });
}
export function useRemoveDashboardWidget(projectId: string) {
    const qc = useQueryClient();
    return useMutation({ mutationFn: (id: string) => dashboardWidgetsApi.remove(projectId, id), onSuccess: () => invalidate(qc, projectId) });
}
export function useReorderDashboardWidgets(projectId: string) {
    const qc = useQueryClient();
    return useMutation({ mutationFn: (ids: string[]) => dashboardWidgetsApi.reorder(projectId, ids), onSuccess: () => invalidate(qc, projectId) });
}
export function useResetDashboardWidgets(projectId: string) {
    const qc = useQueryClient();
    return useMutation({ mutationFn: () => dashboardWidgetsApi.reset(projectId), onSuccess: () => invalidate(qc, projectId) });
}