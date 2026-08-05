using MediatR;

namespace Infera.Application.Features.Releases.CreateRelease;

public record CreateReleaseCommand(Guid ProjectId, string Version, DateOnly? ReleaseDate, string? Description) : IRequest<Guid>;