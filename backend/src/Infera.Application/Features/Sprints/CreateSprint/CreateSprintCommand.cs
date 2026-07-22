using MediatR;

namespace Infera.Application.Features.Sprints.CreateSprint;

public record CreateSprintCommand(
    Guid ProjectId, string Name, string? Goal, DateTime StartDate, DateTime EndDate) : IRequest<Guid>;