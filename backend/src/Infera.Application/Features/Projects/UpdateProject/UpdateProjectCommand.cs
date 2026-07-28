using MediatR;

namespace Infera.Application.Features.Projects.UpdateProject;

public record UpdateProjectCommand(
    Guid ProjectId, string Name, string? Description, DateOnly? StartDate, DateOnly? EndDate) : IRequest;