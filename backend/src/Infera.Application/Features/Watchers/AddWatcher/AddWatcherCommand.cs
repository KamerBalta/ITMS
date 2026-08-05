using MediatR;

namespace Infera.Application.Features.Watchers.AddWatcher;

public record AddWatcherCommand(Guid TaskId, Guid UserId) : IRequest;