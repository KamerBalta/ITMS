using Infera.Domain.Enums;
using MediatR;

namespace Infera.Application.Features.Tasks.UpdateTaskStatus;

public record UpdateTaskStatusCommand(Guid TaskId, ItemStatus NewStatus) : IRequest;