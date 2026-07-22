using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class Label : BaseEntity
{
    public string Name { get; set; } = default!;
    public string? Color { get; set; }

    public ICollection<TaskLabel> TaskLabels { get; set; } = new List<TaskLabel>();
}