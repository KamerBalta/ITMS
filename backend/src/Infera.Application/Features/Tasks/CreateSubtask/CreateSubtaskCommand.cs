using Infera.Domain.Enums;
using MediatR;

namespace Infera.Application.Features.Tasks.CreateSubtask;

public record CreateSubtaskCommand(Guid ParentTaskId, string Title, Guid ReporterId, Guid? AssigneeId) : IRequest<Guid>;