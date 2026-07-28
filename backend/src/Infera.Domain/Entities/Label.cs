using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class Label : BaseEntity,ISoftDelete
{
    public string Name { get; set; } = default!;
    public string? Color { get; set; }

    public ICollection<TaskLabel> TaskLabels { get; set; } = new List<TaskLabel>();
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }
}