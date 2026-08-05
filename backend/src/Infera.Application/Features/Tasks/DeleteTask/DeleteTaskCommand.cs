using MediatR;

namespace Infera.Application.Features.Tasks.DeleteTask;

public record DeleteTaskCommand(Guid TaskId) : IRequest;