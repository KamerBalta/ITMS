using MediatR;

namespace Infera.Application.Features.Users.UpdateUser;

public record UpdateUserCommand(Guid UserId, string Name, string? Title) : IRequest;