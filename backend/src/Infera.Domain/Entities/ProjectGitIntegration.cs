using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class ProjectGitIntegration : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = default!;

    public string Provider { get; set; } = default!; // "GitHub" | "GitLab"
    public string RepositoryUrl { get; set; } = default!; // orn. https://github.com/org/repo
    public string WebhookSecret { get; set; } = default!;


    public Guid? CloseTargetStatusId { get; set; }
    public ProjectWorkflowStatus? CloseTargetStatus { get; set; }

    public string? AzureDevOpsOrgUrl { get; set; }
    public string? AzureDevOpsProjectName { get; set; }
    public string? AzureDevOpsPersonalAccessToken { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}