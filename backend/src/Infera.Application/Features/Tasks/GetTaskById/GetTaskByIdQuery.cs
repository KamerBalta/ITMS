using MediatR;

namespace Infera.Application.Features.Tasks.GetTaskById;

public record GetTaskByIdQuery(Guid TaskId) : IRequest<TaskDetailDto>;

public record TaskDetailDto(
    Guid Id, string Title, string? Description, string IssueType, string Priority,
    string Status, int? StoryPoint, Guid ProjectId, Guid? SprintId, Guid? ParentTaskId,
    string? AssigneeName, string ReporterName, DateTime? DueDate,
    DateTime CreatedAt, DateTime? UpdatedAt,
    List<string> Labels, int CommentCount, int AttachmentCount,
    int ChecklistTotal, int ChecklistDone, int WatcherCount);