using Infera.Domain.Common;

namespace Infera.Domain.Entities;

public class NotificationPreference : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = default!;
    public string NotificationType { get; set; } = default!; // "Task", "Sprint", "Mention", "Release"
    public bool InAppEnabled { get; set; } = true;
    public bool EmailEnabled { get; set; } = true;
    public string EmailFrequency { get; set; } = "Instant"; // "Instant" | "DailyDigest"
}