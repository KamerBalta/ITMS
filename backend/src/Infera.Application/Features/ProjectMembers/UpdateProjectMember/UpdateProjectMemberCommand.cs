using Infera.Domain.Enums;
using MediatR;

namespace Infera.Application.Features.ProjectMembers.UpdateProjectMember;

public record UpdateProjectMemberCommand(
    Guid ProjectId,
    Guid MemberId,
    Guid TeamId,
    ProjectRole ProjectRole
) : IRequest;