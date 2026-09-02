using Infera.Domain.Common;

namespace Infera.Domain.Entities;


public class ProjectComponent : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = default!;

    public string Name { get; set; } = default!;
    public string? Description { get; set; }

    public Guid? LeadUserId { get; set; }
    public User? LeadUser { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}