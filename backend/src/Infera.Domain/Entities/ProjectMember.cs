using Infera.Domain.Common;
using Infera.Domain.Enums;

namespace Infera.Domain.Entities;

public class ProjectMember : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = default!;

    public Guid TeamId { get; set; }
    public Team Team { get; set; } = default!;

    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public ProjectRole ProjectRole { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}