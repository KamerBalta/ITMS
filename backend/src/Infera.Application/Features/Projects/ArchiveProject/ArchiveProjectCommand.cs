using MediatR;

namespace Infera.Application.Features.Projects.ArchiveProject;

public record ArchiveProjectCommand(Guid ProjectId) : IRequest;