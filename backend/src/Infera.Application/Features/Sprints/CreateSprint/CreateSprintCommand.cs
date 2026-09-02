using MediatR;

namespace Infera.Application.Features.Sprints.CreateSprint;

public record CreateSprintCommand(
    Guid ProjectId, string Name, string? Goal, DateOnly StartDate, DateOnly EndDate) : IRequest<Guid>;