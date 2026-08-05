using MediatR;
using Infera.Domain.Enums;

namespace Infera.Application.Features.Tasks.UpdateTaskField;

public record UpdateTaskTitleCommand(Guid TaskId, string Title) : IRequest;
public record UpdateTaskDescriptionCommand(Guid TaskId, string? Description) : IRequest;
public record UpdateTaskPriorityCommand(Guid TaskId, Priority Priority) : IRequest;
public record UpdateTaskStoryPointCommand(Guid TaskId, int? StoryPoint) : IRequest;
public record UpdateTaskDueDateCommand(Guid TaskId, DateTime? DueDate) : IRequest;
public record UpdateTaskReleaseCommand(Guid TaskId, Guid? ReleaseId) : IRequest;