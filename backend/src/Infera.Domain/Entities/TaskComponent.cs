using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class TaskComponent : BaseEntity
{
    public Guid TaskId { get; set; }
    public Task Task { get; set; } = default!;

    public Guid ProjectComponentId { get; set; }
    public ProjectComponent ProjectComponent { get; set; } = default!;
}