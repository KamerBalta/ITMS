using MediatR;

namespace Infera.Application.Features.ProjectMembers.GetProjectMembers;

public record GetProjectMembersQuery(Guid ProjectId) : IRequest<List<ProjectMemberDto>>;

public record ProjectMemberDto(
    Guid MemberId, Guid UserId, string UserName, string? Title, string? AvatarUrl,
    Guid TeamId, string TeamName, string ProjectRole);