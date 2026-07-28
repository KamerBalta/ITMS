using MediatR;

namespace Infera.Application.Features.Users.DeactivateUser;

public record DeactivateUserCommand(Guid UserId) : IRequest;