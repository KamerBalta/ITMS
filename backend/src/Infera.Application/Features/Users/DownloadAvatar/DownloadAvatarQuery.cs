using MediatR;

namespace Infera.Application.Features.Users.DownloadAvatar;

public record DownloadAvatarQuery(Guid UserId) : IRequest<DownloadAvatarResult>;

public record DownloadAvatarResult(Stream FileStream, string ContentType);