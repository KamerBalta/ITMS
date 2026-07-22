using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class WorkLog : BaseEntity
{
    public Guid TaskId { get; set; }
    public Task Task { get; set; } = default!;

    public Guid UserId { get; set; }
    public User User { get; set; } = default!;

    public int TimeSpentMinutes { get; set; }
    public string? Description { get; set; }
    public DateTime LoggedAt { get; set; } = DateTime.UtcNow;
}