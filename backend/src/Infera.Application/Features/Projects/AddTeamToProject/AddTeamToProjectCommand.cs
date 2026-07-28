using MediatR;

namespace Infera.Application.Features.Projects.AddTeamToProject;

public record AddTeamToProjectCommand(Guid ProjectId, Guid TeamId) : IRequest<Guid>;