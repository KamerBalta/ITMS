using MediatR;

namespace Infera.Application.Features.Users.UpdateUserRole;

public record UpdateUserRoleCommand(Guid UserId, string RoleName) : IRequest;