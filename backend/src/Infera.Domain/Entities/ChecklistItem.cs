using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class ChecklistItem : BaseEntity
{
    public Guid TaskId { get; set; }
    public Task Task { get; set; } = default!;

    public string ItemText { get; set; } = default!;
    public bool IsDone { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}