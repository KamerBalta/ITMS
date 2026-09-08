import { apiClient } from './client';
import type { GitIntegrationInfo, GitIntegrationSetupResult, GitCommitItem } from '../types/gitIntegration';

export const gitIntegrationApi = {
    get: (projectId: string) =>
        apiClient.get<GitIntegrationInfo | null>(`/projects/${projectId}/git-integration`).then((res) => res.data),

    getAvailableCommands: (projectId: string) =>
        apiClient.get<{ command: string; statusName: string; category: string }[]>(`/projects/${projectId}/git-integration/available-commands`).then((res) => res.data),

    setup: (projectId: string, data: {
        provider: string;
        repositoryUrl: string;
        closeTargetStatusId?: string;
        azureDevOpsOrgUrl?: string;
        azureDevOpsProjectName?: string;
        azureDevOpsPersonalAccessToken?: string;
    }) => apiClient.post<GitIntegrationSetupResult>(`/projects/${projectId}/git-integration`, data).then((res) => res.data),

    delete: (projectId: string) =>
        apiClient.delete(`/projects/${projectId}/git-integration`),

    getTaskPipelineRuns: (taskId: string) =>
        apiClient.get<{ pipelineName: string; result: string; pipelineUrl: string | null; environment: string | null; version: string | null; deployedAt: string | null; runAt: string }[]>(`/tasks/${taskId}/pipeline-runs`).then((res) => res.data),

    getTaskCommits: (taskId: string) =>
        apiClient.get<GitCommitItem[]>(`/tasks/${taskId}/git-commits`).then((res) => res.data),
};