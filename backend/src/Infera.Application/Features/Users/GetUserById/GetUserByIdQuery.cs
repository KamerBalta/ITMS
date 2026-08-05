using MediatR;

namespace Infera.Application.Features.Users.GetUserById;

public record GetUserByIdQuery(Guid UserId) : IRequest<UserDetailDto>;

public record UserDetailDto(
    Guid Id, string Name, string Email, string? Title, string? AvatarUrl, bool IsActive,
    DateTime CreatedAt, List<string> SystemRoles,
    List<UserProjectDto> Projects, List<string> Teams,
    int CreatedTaskCount, int AssignedTaskCount);

public record UserProjectDto(Guid ProjectId, string ProjectName, string ProjectRole);