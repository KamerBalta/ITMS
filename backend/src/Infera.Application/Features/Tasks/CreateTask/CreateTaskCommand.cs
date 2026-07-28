using Infera.Domain.Enums;
using MediatR;

namespace Infera.Application.Features.Tasks.CreateTask;

public record CreateTaskCommand(
    Guid ProjectId,
    Guid? SprintId,
    Guid? ParentTaskId,
    string Title,
    string? Description,
    IssueType IssueType,
    Priority Priority,
    int? StoryPoint,
    Guid? AssigneeId,
    Guid ReporterId,
    DateTime? DueDate) : IRequest<Guid>;