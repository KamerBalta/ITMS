using Infera.Domain.Enums;

namespace Infera.Application.Common.Interfaces;

public interface INotificationService
{
    System.Threading.Tasks.Task NotifyAsync(Guid userId, string title, string message, NotificationType type, CancellationToken ct = default);
}