using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class UserRole : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public Guid RoleId { get; set; }
    public Role Role { get; set; } = default!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}