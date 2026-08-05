using MediatR;

namespace Infera.Application.Features.Releases.GetReleaseTasks;

public record GetReleaseTasksQuery(Guid ReleaseId) : IRequest<List<ReleaseTaskDto>>;

public record ReleaseTaskDto(Guid Id, string Title,  string Status);