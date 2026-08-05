using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.ProjectMembers.GetProjectMembers;

public class GetProjectMembersQueryHandler : IRequestHandler<GetProjectMembersQuery, List<ProjectMemberDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetProjectMembersQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<List<ProjectMemberDto>> Handle(GetProjectMembersQuery request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        return await _db.ProjectMembers
            .Where(m => m.ProjectId == request.ProjectId)
            .Select(m => new ProjectMemberDto(
                m.Id, m.UserId, m.User.Name, m.User.Title,
                m.TeamId, m.Team.Name, m.ProjectRole.ToString()))
            .ToListAsync(ct);
    }
}