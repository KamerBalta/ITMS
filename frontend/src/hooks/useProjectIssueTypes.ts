import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectIssueTypesApi } from '../api/projectIssueTypes';
import { REFERENCE_STALE_TIME } from '../lib/queryClient';
export function useProjectIssueTypes(projectId: string | null) {
    return useQuery({
        queryKey: ['project-issue-types', projectId],
        queryFn: () => projectIssueTypesApi.getAll(projectId!),
        enabled: !!projectId,
        staleTime: REFERENCE_STALE_TIME,
    });
}

function invalidateAll(qc: ReturnType<typeof useQueryClient>, projectId: string) {
    qc.invalidateQueries({ queryKey: ['project-issue-types', projectId] });
}

export function useAssignIssueType(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (issueTypeId: string) => projectIssueTypesApi.assign(projectId, issueTypeId),
        onSuccess: () => invalidateAll(qc, projectId),
    });
}

export function useRemoveIssueType(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (issueTypeId: string) => projectIssueTypesApi.remove(projectId, issueTypeId),
        onSuccess: () => invalidateAll(qc, projectId),
    });
}

export function useReorderProjectIssueTypes(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (orderedIssueTypeIds: string[]) => projectIssueTypesApi.reorder(projectId, orderedIssueTypeIds),
        onSuccess: () => invalidateAll(qc, projectId),
    });
}