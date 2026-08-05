using MediatR;

namespace Infera.Application.Features.Notifications.MarkAllAsRead;

public record MarkAllAsReadCommand(Guid UserId) : IRequest;