using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class Team : BaseEntity
{
    public string Name { get; set; } = default!;
    public string? Description { get; set; }

    public Guid CreatedBy { get; set; }
    public User Creator { get; set; } = default!;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<TeamMember> Members { get; set; } = new List<TeamMember>();
    public ICollection<ProjectTeam> ProjectTeams { get; set; } = new List<ProjectTeam>();
}