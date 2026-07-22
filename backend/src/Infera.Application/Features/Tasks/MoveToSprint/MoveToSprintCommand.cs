using MediatR;

namespace Infera.Application.Features.Tasks.MoveToSprint;

public record MoveToSprintCommand(Guid TaskId, Guid? SprintId) : IRequest;