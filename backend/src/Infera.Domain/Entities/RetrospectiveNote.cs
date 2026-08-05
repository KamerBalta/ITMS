using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class RetrospectiveNote : BaseEntity
{
    public Guid SprintId { get; set; }
    public Sprint Sprint { get; set; } = default!;

    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public string Category { get; set; } = default!; // "WentWell", "WentWrong", "ActionItem"
    public string Content { get; set; } = default!;
    public bool IsResolved { get; set; } = false; // yalnizca ActionItem icin anlamli
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}