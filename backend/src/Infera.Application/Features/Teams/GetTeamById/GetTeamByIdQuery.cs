using MediatR;

namespace Infera.Application.Features.Teams.GetTeamById;

public record GetTeamByIdQuery(Guid TeamId) : IRequest<TeamDetailDto>;

public record TeamDetailDto(
    Guid Id, string Name, string? Description, string CreatedByName,
    List<TeamMemberDetailDto> Members, List<string> ActiveProjects);

public record TeamMemberDetailDto(Guid UserId, string UserName, string TeamRole);