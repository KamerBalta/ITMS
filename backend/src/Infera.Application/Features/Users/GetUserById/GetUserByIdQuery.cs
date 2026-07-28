using MediatR;

namespace Infera.Application.Features.Users.GetUserById;

public record GetUserByIdQuery(Guid UserId) : IRequest<UserDetailDto>;

public record UserDetailDto(
    Guid Id, string Name, string Email, string? Title, string? AvatarUrl, bool IsActive,
    DateTime CreatedAt, List<string> Roles);