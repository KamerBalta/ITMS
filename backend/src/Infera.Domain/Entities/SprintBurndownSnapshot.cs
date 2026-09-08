using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class SprintBurndownSnapshot : BaseEntity
{
    public Guid SprintId { get; set; }
    public Sprint Sprint { get; set; } = default!;

    public DateOnly SnapshotDate { get; set; }

    public int ScopeStoryPoints { get; set; }

    public int CompletedStoryPoints { get; set; }

    public int RemainingStoryPoints { get; set; }
}