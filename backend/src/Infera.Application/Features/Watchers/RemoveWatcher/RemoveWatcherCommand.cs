using MediatR;

namespace Infera.Application.Features.Watchers.RemoveWatcher;

public record RemoveWatcherCommand(Guid TaskId, Guid UserId) : IRequest;