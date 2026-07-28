using MediatR;

namespace Infera.Application.Features.Teams.RemoveTeamMember;

public record RemoveTeamMemberCommand(Guid TeamId, Guid UserId) : IRequest;