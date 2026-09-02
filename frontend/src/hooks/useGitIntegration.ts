import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gitIntegrationApi } from '../api/gitIntegration';

export function useGitIntegration(projectId: string | null) {
    return useQuery({
        queryKey: ['git-integration', projectId],
        queryFn: () => gitIntegrationApi.get(projectId!),
        enabled: !!projectId,
    });
}
export function useSetupGitIntegration(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ provider, repositoryUrl, closeTargetStatusId }: { provider: string; repositoryUrl: string; closeTargetStatusId?: string }) =>
            gitIntegrationApi.setup(projectId, provider, repositoryUrl, closeTargetStatusId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['git-integration', projectId] }),
    });
}
export function useDeleteGitIntegration(projectId: string) {
    const qc = useQueryClient();
    return useMutation({ mutationFn: () => gitIntegrationApi.delete(projectId), onSuccess: () => qc.invalidateQueries({ queryKey: ['git-integration', projectId] }) });
}
export function useTaskGitCommits(taskId: string) {
    return useQuery({ queryKey: ['task-git-commits', taskId], queryFn: () => gitIntegrationApi.getTaskCommits(taskId) });
}