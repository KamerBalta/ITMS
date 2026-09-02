using Infera.Domain.Common;

namespace Infera.Domain.Entities;

// Bir Task'a baglanmis commit kaydi -- Task Detail'de "Git Activity" bolumunde gosterilir.
public class GitCommitLink : BaseEntity
{
    public Guid TaskId { get; set; }
    public Task Task { get; set; } = default!;

    public string CommitHash { get; set; } = default!;
    public string CommitMessage { get; set; } = default!;
    public string AuthorName { get; set; } = default!;
    public string? CommitUrl { get; set; }
    public string? BranchName { get; set; }
    public DateTime CommittedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}