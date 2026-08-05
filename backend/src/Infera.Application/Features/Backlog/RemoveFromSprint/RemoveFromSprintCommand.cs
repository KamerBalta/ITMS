using MediatR;

namespace Infera.Application.Features.Backlog.RemoveFromSprint;

public record RemoveFromSprintCommand(
    Guid TaskId
) : IRequest;