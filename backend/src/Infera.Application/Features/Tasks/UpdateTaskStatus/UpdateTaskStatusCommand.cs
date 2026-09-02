using MediatR;

namespace Infera.Application.Features.Tasks.UpdateTaskStatus;

public record UpdateTaskStatusCommand(Guid TaskId, Guid NewStatusId) : IRequest;