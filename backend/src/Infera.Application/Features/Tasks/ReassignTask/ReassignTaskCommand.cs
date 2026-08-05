using MediatR;

namespace Infera.Application.Features.Tasks.ReassignTask;

public record ReassignTaskCommand(Guid TaskId, Guid? NewAssigneeId) : IRequest;