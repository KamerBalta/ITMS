using MediatR;

namespace Infera.Application.Features.Notifications.DeleteNotification;

public record DeleteNotificationCommand(Guid NotificationId, Guid UserId) : IRequest;