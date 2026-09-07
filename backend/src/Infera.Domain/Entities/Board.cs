using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class Board : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = default!;

    public string Name { get; set; } = default!;
    public string BoardType { get; set; } = default!; // "Scrum" | "Kanban"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}