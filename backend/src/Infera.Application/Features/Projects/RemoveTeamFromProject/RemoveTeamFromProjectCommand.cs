using MediatR;

namespace Infera.Application.Features.Projects.RemoveTeamFromProject;

public record RemoveTeamFromProjectCommand(Guid ProjectId, Guid TeamId) : IRequest;