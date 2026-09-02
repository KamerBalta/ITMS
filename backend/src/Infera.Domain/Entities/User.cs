using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class User : BaseEntity
{
    public string Name { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string PasswordHash { get; set; } = default!;
    public string? Title { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public string? PasswordResetTokenHash { get; set; }
    public DateTime? PasswordResetTokenExpiresAt { get; set; }
    public Guid TokenVersion { get; set; } = Guid.NewGuid();
    public string? AvatarUrl { get; set; }
    public DateTime? LastLoginAt { get; set; }
    public bool MustChangePassword { get; set; } = false;
    public string? ActivationTokenHash { get; set; }
    public DateTime? ActivationTokenExpiresAt { get; set; }
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<TeamMember> TeamMemberships { get; set; } = new List<TeamMember>();
    public ICollection<ProjectMember> ProjectMemberships { get; set; } = new List<ProjectMember>();
}