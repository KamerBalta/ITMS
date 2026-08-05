using MediatR;

namespace Infera.Application.Features.Users.ActivateUser;

public record ActivateUserCommand(Guid UserId) : IRequest;