using MediatR;

namespace Infera.Application.Features.Notifications.MarkAsRead;

public record MarkAsReadCommand(Guid NotificationId, Guid UserId) : IRequest;