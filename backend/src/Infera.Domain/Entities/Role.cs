using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class Role : BaseEntity
{
    public string Name { get; set; } = default!;   // Admin, Project Manager, Developer, QA/Tester
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}