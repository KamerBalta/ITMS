using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class TaskLink : BaseEntity
{
    public Guid SourceTaskId { get; set; }
    public Task SourceTask { get; set; } = default!;

    public Guid TargetTaskId { get; set; }
    public Task TargetTask { get; set; } = default!;

    // "Blocks", "RelatesTo", "Duplicates" -- kaynaktan hedefe dogru okunur (Source Blocks Target)
    public string LinkType { get; set; } = default!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}