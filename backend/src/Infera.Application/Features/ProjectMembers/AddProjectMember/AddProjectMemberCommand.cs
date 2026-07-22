using Infera.Domain.Enums;
using MediatR;

namespace Infera.Application.Features.ProjectMembers.AddProjectMember;

public record AddProjectMemberCommand(
    Guid ProjectId, Guid TeamId, Guid UserId, ProjectRole ProjectRole) : IRequest<Guid>;