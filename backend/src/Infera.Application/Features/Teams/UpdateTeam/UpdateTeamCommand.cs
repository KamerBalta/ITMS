using MediatR;

namespace Infera.Application.Features.Teams.UpdateTeam;

public record UpdateTeamCommand(Guid TeamId, string Name, string? Description) : IRequest;