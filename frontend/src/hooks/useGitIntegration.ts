import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { gitIntegrationApi } from '../api/gitIntegration';
import { REFERENCE_STALE_TIME } from '../lib/queryClient';

export function useGitIntegration(projectId: string | null) {
    return useQuery({
        queryKey: ['git-integration', projectId],
        queryFn: () => gitIntegrationApi.get(projectId!),
        enabled: !!projectId,
    });
}

export function useAvailableCommitCommands(projectId: string | null) {
    return useQuery({
        queryKey: ['git-commit-commands', projectId],
        queryFn: () => gitIntegrationApi.getAvailableCommands(projectId!),
        enabled: !!projectId,
        staleTime: REFERENCE_STALE_TIME,
    });
}

export function useSetupGitIntegration(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: {
            provider: string;
            repositoryUrl: string;
            closeTargetStatusId?: string;
            azureDevOpsOrgUrl?: string;
            azureDevOpsProjectName?: string;
            azureDevOpsPersonalAccessToken?: string;
        }) => gitIntegrationApi.setup(projectId, data),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['git-integration', projectId] }),
    });
}

export function useDeleteGitIntegration(projectId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => gitIntegrationApi.delete(projectId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['git-integration', projectId] }),
    });
}

export function useTaskPipelineRuns(taskId: string) {
    return useQuery({
        queryKey: ['task-pipeline-runs', taskId],
        queryFn: () => gitIntegrationApi.getTaskPipelineRuns(taskId),
    });
}

export function useTaskGitCommits(taskId: string) {
    return useQuery({
        queryKey: ['task-git-commits', taskId],
        queryFn: () => gitIntegrationApi.getTaskCommits(taskId),
    });
}