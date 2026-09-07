using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class BoardColumn : BaseEntity
{
    public Guid BoardId { get; set; }
    public Board Board { get; set; } = default!;

    public string Name { get; set; } = default!;
    public int DisplayOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}