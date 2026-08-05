using MediatR;

namespace Infera.Application.Features.Releases.GetReleaseById;

public record GetReleaseByIdQuery(Guid ReleaseId) : IRequest<ReleaseDetailDto>;

public record ReleaseDetailDto(Guid Id, string Version, DateOnly? ReleaseDate, string? Description, string ProjectName);