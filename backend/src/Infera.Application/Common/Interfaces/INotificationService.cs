using Infera.Domain.Enums;

namespace Infera.Application.Common.Interfaces;

public interface INotificationService
{
    System.Threading.Tasks.Task NotifyAsync(
        Guid userId,
        string title,
        string message,
        Domain.Enums.NotificationType type,
        string? actionUrl = null,
        bool isImportant = true,
        CancellationToken ct = default);
}