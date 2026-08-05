using Infera.Domain.Common;
using Infera.Domain.Enums;

namespace Infera.Domain.Entities;

public class Project : BaseEntity
{
    public string Name { get; set; } = default!;
    public string Key { get; set; } = default!;
    public string? Description { get; set; }

    public Guid OwnerId { get; set; }
    public User Owner { get; set; } = default!;

    public ProjectStatus Status { get; set; } = ProjectStatus.Active;
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int NextTaskNumber { get; set; } = 1;

    public ICollection<ProjectTeam> ProjectTeams { get; set; } = new List<ProjectTeam>();
    public ICollection<ProjectMember> Members { get; set; } = new List<ProjectMember>();
    public ICollection<Sprint> Sprints { get; set; } = new List<Sprint>();
    public ICollection<Domain.Entities.Task> Tasks { get; set; } = new List<Domain.Entities.Task>();
    public ICollection<Release> Releases { get; set; } = new List<Release>();
}