using MediatR;

namespace Infera.Application.Features.Tasks.UpdateTask;

public record UpdateTaskCommand(
    Guid TaskId, string Title, string? Description, Infera.Domain.Enums.Priority Priority,
    int? StoryPoint, DateTime? DueDate) : IRequest;