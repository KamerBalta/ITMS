using MediatR;

namespace Infera.Application.Features.Releases.GetReleases;

public record GetReleasesQuery(Guid ProjectId) : IRequest<List<ReleaseDto>>;

public record ReleaseDto(Guid Id, string Version, DateOnly? ReleaseDate, string? Description);