import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workflowApi } from '../api/workflow';

export function useWorkflowTransitions(projectId: string | null) {
    return useQuery({
        queryKey: ['workflow', projectId],
        queryFn: () => workflowApi.getAll(projectId!),
        enabled: !!projectId,
    });
}

function invalidate(qc: ReturnType<typeof useQueryClient>, projectId: string) {
    qc.invalidateQueries({ queryKey: ['workflow', projectId] });
}

export function useCreateTransition(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { fromStatus: string; toStatus: string; allowedRoles: string[]; requireAssigneeSelf: boolean }) =>
            workflowApi.create(projectId, data),
        onSuccess: () => invalidate(qc, projectId),
    });
}

export function useUpdateTransition(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { allowedRoles: string[]; requireAssigneeSelf: boolean } }) =>
            workflowApi.update(projectId, id, data),
        onSuccess: () => invalidate(qc, projectId),
    });
}

export function useDeleteTransition(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => workflowApi.delete(projectId, id),
        onSuccess: () => invalidate(qc, projectId),
    });
}