using MediatR;

namespace Infera.Application.Features.Sprints.UpdateSprint;

public record UpdateSprintCommand(Guid SprintId, string Name, string? Goal, DateTime StartDate, DateTime EndDate) : IRequest;