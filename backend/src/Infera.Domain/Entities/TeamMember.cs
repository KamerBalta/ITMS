using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class TeamMember : BaseEntity,ISoftDelete
{
    public Guid TeamId { get; set; }
    public Team Team { get; set; } = default!;

    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public string TeamRole { get; set; } = default!;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }
}