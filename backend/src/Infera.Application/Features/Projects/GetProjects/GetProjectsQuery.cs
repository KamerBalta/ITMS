using MediatR;

namespace Infera.Application.Features.Projects.GetProjects;

public record GetProjectsQuery : IRequest<List<ProjectDto>>;

public record ProjectDto(
    Guid Id, string Name, string Key, string? Description,
    string OwnerName, string Status, Guid StatusId, List<TeamSummaryDto> Teams);

public record TeamSummaryDto(Guid TeamId, string TeamName);