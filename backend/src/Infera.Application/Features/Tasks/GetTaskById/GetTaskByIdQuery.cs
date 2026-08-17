using MediatR;

namespace Infera.Application.Features.Tasks.GetTaskById;

public record GetTaskByIdQuery(Guid TaskId) : IRequest<TaskDetailDto>;

public record TaskDetailDto(
    Guid Id, string Title, string? Description, string IssueType, string? IssueTypeIcon,
    Guid? IssueTypeId, bool AllowsChildren, bool RequiresParent, string Priority,
    string Status, int? StoryPoint, Guid ProjectId, string ProjectName, string ProjectKey,
    string IssueKey, Guid? SprintId, Guid? ParentTaskId,
    string? AssigneeName, string ReporterName, DateOnly? DueDate,
    DateTime CreatedAt, DateTime? UpdatedAt,
    List<string> Labels, int CommentCount, int AttachmentCount,
    int ChecklistTotal, int ChecklistDone, int WatcherCount,
    Guid? ReleaseId, string? ReleaseVersion, List<TaskComponentDto> Components,
    int? OriginalEstimateMinutes, int? RemainingEstimateMinutes);

public record TaskComponentDto(Guid Id, string Name, Guid? LeadUserId, string? LeadUserName);