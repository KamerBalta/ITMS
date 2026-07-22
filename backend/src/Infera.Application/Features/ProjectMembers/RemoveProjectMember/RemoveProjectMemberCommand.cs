using MediatR;

namespace Infera.Application.Features.ProjectMembers.RemoveProjectMember;

public record RemoveProjectMemberCommand(Guid ProjectId, Guid MemberId) : IRequest;