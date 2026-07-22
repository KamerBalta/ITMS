using MediatR;

namespace Infera.Application.Features.Tasks.GetTasks;

public record GetTasksQuery(
    Guid ProjectId,
    Guid? SprintId,
    bool? BacklogOnly,     // true -> SprintId == null (Bolum 9 Backlog)
    Guid? AssigneeId,
    string? Status) : IRequest<List<TaskDto>>;

public record TaskDto(
    Guid Id, string Title, string IssueType, string Priority, string Status,
    int? StoryPoint, string? AssigneeName, Guid? SprintId, long Rank);