using MediatR;

namespace Infera.Application.Features.Projects.DeleteProject;

public record DeleteProjectCommand(Guid ProjectId) : IRequest;