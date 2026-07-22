using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.ProjectMembers.GetProjectMembers;

public class GetProjectMembersQueryHandler : IRequestHandler<GetProjectMembersQuery, List<ProjectMemberDto>>
{
    private readonly IAppDbContext _db;
    public GetProjectMembersQueryHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<List<ProjectMemberDto>> Handle(GetProjectMembersQuery request, CancellationToken ct)
    {
        return await _db.ProjectMembers
            .Where(m => m.ProjectId == request.ProjectId)
            .Select(m => new ProjectMemberDto(
                m.Id, m.UserId, m.User.Name, m.User.Title,
                m.TeamId, m.Team.Name, m.ProjectRole.ToString()))
            .ToListAsync(ct);
    }
}