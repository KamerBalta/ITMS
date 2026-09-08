using MediatR;

namespace Infera.Application.Features.Tasks.GetTasks;

public record GetTasksQuery(
    Guid ProjectId,
    Guid? SprintId,
    bool? BacklogOnly,
    Guid? AssigneeId,
    Guid? ReporterId,
    string? Status,
    Guid? IssueTypeId,
    Infera.Domain.Enums.Priority? Priority,
    string? Search,
    Guid? ParentTaskId,
    Guid? LabelId,
    Guid? ComponentId,
    bool? UnassignedOnly,
    Guid? BoardId,

    DateTime? CreatedAfter,
    DateTime? CreatedBefore,

    DateOnly? DueDateAfter,
    DateOnly? DueDateBefore,

    DateTime? UpdatedAfter,
    DateTime? UpdatedBefore,
    bool? OverdueOnly,
    int Page = 1,
    int PageSize = 50
) : IRequest<List<TaskDto>>;

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
    string Status,
    Guid StatusId,
    int? StoryPoint,
    Guid? AssigneeId,
    string? AssigneeName,
    Guid ReporterId,
    string ReporterName,
    Guid? SprintId,
    long Rank,
    Guid? ParentTaskId,
    List<string> Labels,
    DateOnly? DueDate);