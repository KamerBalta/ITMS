using MediatR;

namespace Infera.Application.Features.Users.DeleteMyAvatar;

public record DeleteMyAvatarCommand(Guid UserId) : IRequest;