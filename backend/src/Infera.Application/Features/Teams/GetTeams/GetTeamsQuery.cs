using MediatR;

namespace Infera.Application.Features.Teams.GetTeams;

public record GetTeamsQuery : IRequest<List<TeamDto>>;

public record TeamDto(Guid Id, string Name, string? Description, List<TeamMemberDto> Members);
public record TeamMemberDto(Guid UserId, string UserName, string TeamRole);