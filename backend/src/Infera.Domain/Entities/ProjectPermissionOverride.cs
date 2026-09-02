using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class ProjectPermissionOverride : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = default!;

    public string PermissionKey { get; set; } = default!; // "DeveloperCanManageSprints", "DeveloperCanReassign"
    public bool IsEnabled { get; set; }
}