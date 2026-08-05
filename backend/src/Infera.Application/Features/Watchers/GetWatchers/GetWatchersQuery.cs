using MediatR;

namespace Infera.Application.Features.Watchers.GetWatchers;

public record GetWatchersQuery(Guid TaskId) : IRequest<List<WatcherDto>>;

public record WatcherDto(Guid UserId, string UserName);