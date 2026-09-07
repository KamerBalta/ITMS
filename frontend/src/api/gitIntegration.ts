import { apiClient } from './client';
import type { GitIntegrationInfo, GitIntegrationSetupResult, GitCommitItem } from '../types/gitIntegration';

export const gitIntegrationApi = {
    get: (projectId: string) =>
        apiClient.get<GitIntegrationInfo | null>(`/projects/${projectId}/git-integration`).then((res) => res.data),

    getAvailableCommands: (projectId: string) =>
        apiClient.get<{ command: string; statusName: string; category: string }[]>(`/projects/${projectId}/git-integration/available-commands`).then((res) => res.data),

    setup: (projectId: string, provider: string, repositoryUrl: string, closeTargetStatusId?: string) =>
        apiClient.post<GitIntegrationSetupResult>(`/projects/${projectId}/git-integration`, { provider, repositoryUrl, closeTargetStatusId }).then((res) => res.data),

    delete: (projectId: string) =>
        apiClient.delete(`/projects/${projectId}/git-integration`),

    getTaskCommits: (taskId: string) =>
        apiClient.get<GitCommitItem[]>(`/tasks/${taskId}/git-commits`).then((res) => res.data),
};