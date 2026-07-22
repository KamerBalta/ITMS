using MediatR;

namespace Infera.Application.Features.Teams.AddTeamMember;

public record AddTeamMemberCommand(Guid TeamId, Guid UserId, string TeamRole) : IRequest<Guid>;