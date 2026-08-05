import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { issueTypesApi, type IssueTypePayload } from '../api/issueTypes';

export function useIssueTypes(activeOnly = false) {
    return useQuery({
        queryKey: ['issue-types', activeOnly],
        queryFn: () => issueTypesApi.getAll(activeOnly),
    });
}

function invalidate(qc: ReturnType<typeof useQueryClient>) {
    qc.invalidateQueries({ queryKey: ['issue-types'] });
}

export function useCreateIssueType() {
    const qc = useQueryClient();
    return useMutation({ mutationFn: (data: IssueTypePayload) => issueTypesApi.create(data), onSuccess: () => invalidate(qc) });
}

export function useUpdateIssueType() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: IssueTypePayload }) => issueTypesApi.update(id, data),
        onSuccess: () => invalidate(qc),
    });
}

export function useToggleIssueTypeActive() {
    const qc = useQueryClient();
    return useMutation({ mutationFn: (id: string) => issueTypesApi.toggleActive(id), onSuccess: () => invalidate(qc) });
}

export function useDeleteIssueType() {
    const qc = useQueryClient();
    return useMutation({ mutationFn: (id: string) => issueTypesApi.delete(id), onSuccess: () => invalidate(qc) });
}