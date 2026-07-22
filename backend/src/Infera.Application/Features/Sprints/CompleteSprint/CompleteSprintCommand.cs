using MediatR;

namespace Infera.Application.Features.Sprints.CompleteSprint;

public record CompleteSprintCommand(Guid SprintId) : IRequest;