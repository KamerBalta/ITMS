using Infera.Domain.Enums;
using MediatR;

namespace Infera.Application.Features.Tasks.CreateTask;

public record CreateTaskCommand(
    Guid ProjectId,
    Guid? SprintId,
    Guid? ParentTaskId,
    Guid IssueTypeId,
    string Title,
    string? Description,
    Priority Priority,
    int? StoryPoint,
    Guid? AssigneeId,
    Guid ReporterId,
    DateOnly? DueDate) : IRequest<Guid>;