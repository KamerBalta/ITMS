using MediatR;

namespace Infera.Application.Features.ProjectMembers.GetUserProjects;

public record GetUserProjectsQuery(Guid UserId) : IRequest<List<UserProjectDto>>;

public record UserProjectDto(Guid ProjectId, string ProjectName, string ProjectKey, string TeamName, string ProjectRole);