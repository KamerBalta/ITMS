using MediatR;

namespace Infera.Application.Features.Users.GetUsers;

public record GetUsersQuery : IRequest<List<UserListDto>>;

public record UserListDto(Guid Id, string Name, string Email, string? Title, bool IsActive, List<string> Roles);