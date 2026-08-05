using Infera.Domain.Common;

namespace Infera.Domain.Entities;

// "Bu proje, global katalogdan hangi Issue Type'lari kullaniyor" iliskisi.
public class ProjectIssueTypeAssignment : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = default!;

    public Guid IssueTypeId { get; set; }
    public IssueType IssueType { get; set; } = default!;

    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}