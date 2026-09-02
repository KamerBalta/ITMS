using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class ChangelogEntry : BaseEntity
{
    public string Title { get; set; } = default!;
    public string Description { get; set; } = default!;
    public string Category { get; set; } = "Feature"; // "Feature" | "Improvement" | "Fix" | "BreakingChange"
    public DateTime PublishedAt { get; set; } = DateTime.UtcNow;
    public Guid CreatedByUserId { get; set; }
}