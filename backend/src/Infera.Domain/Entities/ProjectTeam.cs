using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class ProjectTeam : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = default!;

    public Guid TeamId { get; set; }
    public Team Team { get; set; } = default!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}