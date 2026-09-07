using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class BoardColumnSetting : BaseEntity
{
    public Guid BoardId { get; set; }
    public Board Board { get; set; } = default!;

    public Guid BoardColumnId { get; set; }
    public BoardColumn BoardColumn { get; set; } = default!;

    public int? WipLimit { get; set; }
}