using MediatR;

namespace Infera.Application.Features.Roles.GetRoles;

public record GetRolesQuery : IRequest<List<RoleDto>>;

public record RoleDto(Guid Id, string Name, string? Description);