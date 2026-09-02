import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { boardColumnsApi } from '../api/boardColumns';
import { REFERENCE_STALE_TIME } from '../lib/queryClient';
function invalidate(qc: ReturnType<typeof useQueryClient>, projectId: string) {
    qc.invalidateQueries({ queryKey: ['board-columns', projectId] });
    qc.invalidateQueries({ queryKey: ['board-column-settings', projectId] });
    qc.invalidateQueries({ queryKey: ['workflow-statuses', projectId] });
}

export function useBoardColumns(projectId: string | null) {
    return useQuery({
        queryKey: ['board-columns',
            projectId], queryFn: () => boardColumnsApi.getAll(projectId!),
        enabled: !!projectId,
        staleTime: REFERENCE_STALE_TIME,
    });
}
export function useBoardColumnSettings(projectId: string | null) {
    return useQuery({ queryKey: ['board-column-settings', projectId], queryFn: () => boardColumnsApi.getSettings(projectId!), enabled: !!projectId });
}
export function useCreateBoardColumn(projectId: string) {
    const qc = useQueryClient();
    return useMutation({ mutationFn: (name: string) => boardColumnsApi.create(projectId, name), onSuccess: () => invalidate(qc, projectId) });
}
export function useUpdateBoardColumn(projectId: string) {
    const qc = useQueryClient();
    return useMutation({ mutationFn: ({ id, name }: { id: string; name: string }) => boardColumnsApi.update(projectId, id, name), onSuccess: () => invalidate(qc, projectId) });
}
export function useDeleteBoardColumn(projectId: string) {
    const qc = useQueryClient();
    return useMutation({ mutationFn: (id: string) => boardColumnsApi.delete(projectId, id), onSuccess: () => invalidate(qc, projectId) });
}
export function useReorderBoardColumns(projectId: string) {
    const qc = useQueryClient();
    return useMutation({ mutationFn: (ids: string[]) => boardColumnsApi.reorder(projectId, ids), onSuccess: () => invalidate(qc, projectId) });
}
export function useMapStatusToColumn(projectId: string) {
    const qc = useQueryClient();
    return useMutation({ mutationFn: ({ statusId, columnId }: { statusId: string; columnId: string | null }) => boardColumnsApi.mapStatus(projectId, statusId, columnId), onSuccess: () => invalidate(qc, projectId) });
}
export function useUpdateWipLimit(projectId: string) {
    const qc = useQueryClient();
    return useMutation({ mutationFn: ({ columnId, wipLimit }: { columnId: string; wipLimit: number | null }) => boardColumnsApi.updateWipLimit(projectId, columnId, wipLimit), onSuccess: () => invalidate(qc, projectId) });
}