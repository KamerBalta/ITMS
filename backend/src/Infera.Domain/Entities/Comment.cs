using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class Comment : BaseEntity,ISoftDelete
{
    public Guid TaskId { get; set; }
    public Task Task { get; set; } = default!;

    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public string Content { get; set; } = default!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public Guid? DeletedBy { get; set; }
}