import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workflowApi } from '../api/workflow';
import { REFERENCE_STALE_TIME } from '../lib/queryClient';
function invalidate(qc: ReturnType<typeof useQueryClient>, projectId: string) {
    qc.invalidateQueries({ queryKey: ['workflow-statuses', projectId] });
    qc.invalidateQueries({ queryKey: ['workflow-transitions', projectId] });
    qc.invalidateQueries({ queryKey: ['workflow-unpublished', projectId] });
}

export function useWorkflowStatuses(projectId: string | null, includeDraft = false) {
    return useQuery({
        queryKey: ['workflow-statuses', projectId, includeDraft],
        queryFn: () => workflowApi.getStatuses(projectId!, includeDraft),
        enabled: !!projectId,
        staleTime: REFERENCE_STALE_TIME,
    });
}

export function useWorkflowTransitions(projectId: string | null, includeDraft = false) {
    return useQuery({
        queryKey: ['workflow-transitions', projectId, includeDraft],
        queryFn: () => workflowApi.getTransitions(projectId!, includeDraft),
        enabled: !!projectId,
    });
}

export function useHasUnpublishedChanges(projectId: string | null) {
    return useQuery({
        queryKey: ['workflow-unpublished', projectId],
        queryFn: () => workflowApi.hasUnpublishedChanges(projectId!),
        enabled: !!projectId,
        refetchInterval: 10_000,
    });
}

export function useCreateStatus(projectId: string) {
    const qc = useQueryClient();
    return useMutation({ mutationFn: (data: { name: string; category: string; color?: string }) => workflowApi.createStatus(projectId, data), onSuccess: () => invalidate(qc, projectId) });
}
export function useUpdateStatus(projectId: string) {
    const qc = useQueryClient();
    return useMutation({ mutationFn: ({ id, data }: { id: string; data: { name: string; category: string; color?: string } }) => workflowApi.updateStatus(projectId, id, data), onSuccess: () => invalidate(qc, projectId) });
}
export function useDeleteStatus(projectId: string) {
    const qc = useQueryClient();
    return useMutation({ mutationFn: (id: string) => workflowApi.deleteStatus(projectId, id), onSuccess: () => invalidate(qc, projectId) });
}
export function useReorderStatuses(projectId: string) {
    const qc = useQueryClient();
    return useMutation({ mutationFn: (ids: string[]) => workflowApi.reorderStatuses(projectId, ids), onSuccess: () => invalidate(qc, projectId) });
}
export function useSetInitialStatus(projectId: string) {
    const qc = useQueryClient();
    return useMutation({ mutationFn: (id: string) => workflowApi.setInitial(projectId, id), onSuccess: () => invalidate(qc, projectId) });
}
export function useSetEpicCloseTarget(projectId: string) {
    const qc = useQueryClient();
    return useMutation({ mutationFn: (id: string) => workflowApi.setEpicCloseTarget(projectId, id), onSuccess: () => invalidate(qc, projectId) });
}

export function useCreateTransition(projectId: string) {
    const qc = useQueryClient();
    return useMutation({ mutationFn: (data: { fromStatusId: string; toStatusId: string; allowedRoles: string[]; requireAssigneeSelf: boolean }) => workflowApi.createTransition(projectId, data), onSuccess: () => invalidate(qc, projectId) });
}
export function useUpdateTransition(projectId: string) {
    const qc = useQueryClient();
    return useMutation({ mutationFn: ({ id, data }: { id: string; data: { allowedRoles: string[]; requireAssigneeSelf: boolean } }) => workflowApi.updateTransition(projectId, id, data), onSuccess: () => invalidate(qc, projectId) });
}
export function useDeleteTransition(projectId: string) {
    const qc = useQueryClient();
    return useMutation({ mutationFn: (id: string) => workflowApi.deleteTransition(projectId, id), onSuccess: () => invalidate(qc, projectId) });
}
export function usePublishWorkflow(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => workflowApi.publish(projectId),
        onSuccess: () => {
            invalidate(qc, projectId);
            qc.invalidateQueries({ queryKey: ['tasks', projectId] }); // Board kolonlari yeniden cekilsin
        },
    });
}