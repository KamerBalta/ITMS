using Infera.Domain.Common;
using Infera.Domain.Enums;

namespace Infera.Domain.Entities;

public class Sprint : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = default!;

    public string Name { get; set; } = default!;
    public string? Goal { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public SprintStatus Status { get; set; } = SprintStatus.Active;
    public int? CommittedStoryPoints { get; set; } 
    public ICollection<Domain.Entities.Task> Tasks { get; set; } = new List<Domain.Entities.Task>();
}