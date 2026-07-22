using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class AuditLog : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public string Action { get; set; } = default!;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}