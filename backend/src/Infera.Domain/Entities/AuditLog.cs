using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class AuditLog : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    // FieldAuditLogger için gereken eksik alanlar eklendi:
    public string EntityType { get; set; } = default!;
    public Guid EntityId { get; set; }

    public string? FieldName { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string Action { get; set; } = default!;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}