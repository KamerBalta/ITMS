using MediatR;

namespace Infera.Application.Features.Sprints.GetSprints;

public record GetSprintsQuery(Guid ProjectId) : IRequest<List<SprintDto>>;

public record SprintDto(
    Guid Id, string Name, string? Goal, DateTime StartDate, DateTime EndDate,
    string Status, int TaskCount, int TotalStoryPoints);