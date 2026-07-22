using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class TaskLabel : BaseEntity
{
    public Guid TaskId { get; set; }
    public Task Task { get; set; } = default!;

    public Guid LabelId { get; set; }
    public Label Label { get; set; } = default!;
}