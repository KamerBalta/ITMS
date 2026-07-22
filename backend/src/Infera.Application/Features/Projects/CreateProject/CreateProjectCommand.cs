using MediatR;

namespace Infera.Application.Features.Projects.CreateProject;

public record CreateProjectCommand(
    string Name,
    string Key,
    string? Description,
    Guid OwnerId,
    List<Guid> TeamIds,
    DateOnly? StartDate) : IRequest<Guid>;