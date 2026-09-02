using MediatR;

namespace Infera.Application.Features.Tasks.UpdateTask;

public record UpdateTaskCommand(
    Guid TaskId, string Title, string? Description, Infera.Domain.Enums.Priority Priority,
    int? StoryPoint, DateOnly? DueDate) : IRequest;