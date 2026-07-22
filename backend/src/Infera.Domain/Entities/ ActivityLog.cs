using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class ActivityLog : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public string Action { get; set; } = default!;
    public string EntityType { get; set; } = default!;
    public Guid EntityId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}