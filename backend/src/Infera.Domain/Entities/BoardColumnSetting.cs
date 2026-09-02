using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class BoardColumnSetting : BaseEntity
{
    public Guid ProjectId { get; set; }
    public Project Project { get; set; } = default!;

    public Guid BoardColumnId { get; set; }
    public BoardColumn BoardColumn { get; set; } = default!;

    public int? WipLimit { get; set; }
}