using MediatR;

namespace Infera.Application.Features.Projects.UnarchiveProject;

public record UnarchiveProjectCommand(Guid ProjectId) : IRequest;