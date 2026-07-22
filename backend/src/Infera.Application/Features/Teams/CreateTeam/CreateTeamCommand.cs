using MediatR;

namespace Infera.Application.Features.Teams.CreateTeam;

public record CreateTeamCommand(string Name, string? Description, Guid CreatedByUserId) : IRequest<Guid>;