export interface GitIntegrationInfo {
  provider: 'GitHub' | 'GitLab';
  repositoryUrl: string;
  isActive: boolean;
  closeTargetStatusId: string | null;
  webhookUrl: string;
}

export interface GitIntegrationSetupResult {
  webhookUrl: string;
  webhookSecret: string;
}

export interface GitCommitItem {
  commitHash: string;
  commitMessage: string;
  authorName: string;
  commitUrl: string | null;
  branchName: string | null;
  committedAt: string;
}