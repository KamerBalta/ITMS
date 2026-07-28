using MediatR;

namespace Infera.Application.Features.Releases.UpdateRelease;

public record UpdateReleaseCommand(Guid ReleaseId, DateOnly? ReleaseDate, string? Description) : IRequest;