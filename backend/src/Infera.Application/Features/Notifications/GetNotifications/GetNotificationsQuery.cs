using MediatR;

namespace Infera.Application.Features.Notifications.GetNotifications;

public record GetNotificationsQuery(Guid UserId) : IRequest<List<NotificationDto>>;

public record NotificationDto(Guid Id, string Title, string Message, string Type, bool IsRead, DateTime CreatedAt);