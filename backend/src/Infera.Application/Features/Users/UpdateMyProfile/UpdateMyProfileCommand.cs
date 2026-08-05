using MediatR;

namespace Infera.Application.Features.Users.UpdateMyProfile;

public record UpdateMyProfileCommand(Guid UserId, string Name, string? Title) : IRequest;