using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.ProjectMembers.GetUserProjects;

public class GetUserProjectsQueryHandler : IRequestHandler<GetUserProjectsQuery, List<UserProjectDto>>
{
    private readonly IAppDbContext _db;
    public GetUserProjectsQueryHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<List<UserProjectDto>> Handle(GetUserProjectsQuery request, CancellationToken ct)
    {
        return await _db.ProjectMembers
            .Where(m => m.UserId == request.UserId)
            .Select(m => new UserProjectDto(
                m.ProjectId, m.Project.Name, m.Project.Key, m.Team.Name, m.ProjectRole.ToString()))
            .ToListAsync(ct);
    }
}