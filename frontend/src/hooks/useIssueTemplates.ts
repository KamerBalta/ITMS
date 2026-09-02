import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { issueTemplatesApi } from '../api/issueTemplates';
import { REFERENCE_STALE_TIME } from '../lib/queryClient';

export function useIssueTemplates(projectId: string | null) {
    return useQuery({
        queryKey: ['issue-templates', projectId],
        queryFn: () => issueTemplatesApi.getAll(projectId!),
        enabled: !!projectId,
        staleTime: REFERENCE_STALE_TIME,
    });
}
export function useCreateIssueTemplate(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: { issueTypeId: string; name: string; descriptionTemplate?: string; defaultPriority?: number; isDefault: boolean }) =>
            issueTemplatesApi.create(projectId, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['issue-templates', projectId] }),
    });
}
export function useDeleteIssueTemplate(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => issueTemplatesApi.delete(projectId, id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['issue-templates', projectId] }),
    });
}