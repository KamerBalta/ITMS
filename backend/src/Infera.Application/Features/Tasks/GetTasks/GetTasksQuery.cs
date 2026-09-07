using MediatR;

namespace Infera.Application.Features.Tasks.GetTasks;

public record GetTasksQuery(
    Guid ProjectId,
    Guid? SprintId,
    bool? BacklogOnly,
    Guid? AssigneeId,
    string? Status,
    Guid? IssueTypeId,
    Infera.Domain.Enums.Priority? Priority,
    string? Search,
    Guid? ParentTaskId,
    Guid? LabelId,
    Guid? ComponentId,
    bool? UnassignedOnly,
    Guid? BoardId,
    int Page = 1,
    int PageSize = 50) : IRequest<List<TaskDto>>;

public record TaskDto(
    Guid Id,
    string Title,
    string IssueType,
    string? IssueTypeIcon,
    string IssueKey,
    Guid? IssueTypeId,
    bool AllowsChildren,
    bool RequiresParent,
    string Priority,
    string Status, Guid StatusId,
    int? StoryPoint,
    Guid? AssigneeId,
    string? AssigneeName,
    Guid? SprintId,
    long Rank,
    Guid? ParentTaskId,
    List<string> Labels);