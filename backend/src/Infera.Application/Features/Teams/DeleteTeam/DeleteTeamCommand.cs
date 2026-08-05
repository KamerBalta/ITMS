using MediatR;

namespace Infera.Application.Features.Teams.DeleteTeam;

public record DeleteTeamCommand(Guid TeamId) : IRequest;