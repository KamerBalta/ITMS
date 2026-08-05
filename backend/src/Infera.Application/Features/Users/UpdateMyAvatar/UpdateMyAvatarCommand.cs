using MediatR;

namespace Infera.Application.Features.Users.UpdateMyAvatar;

public record UpdateMyAvatarCommand(Guid UserId, Stream FileStream, string FileName) : IRequest<string>;