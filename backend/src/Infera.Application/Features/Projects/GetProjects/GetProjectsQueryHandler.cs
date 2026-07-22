using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Projects.GetProjects;

public class GetProjectsQueryHandler : IRequestHandler<GetProjectsQuery, List<ProjectDto>>
{
    private readonly IAppDbContext _db;
    public GetProjectsQueryHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<List<ProjectDto>> Handle(GetProjectsQuery request, CancellationToken ct)
    {
        return await _db.Projects
            .Select(p => new ProjectDto(
                p.Id, p.Name, p.Key, p.Description,
                p.Owner.Name, p.Status.ToString(),
                p.ProjectTeams.Select(pt => new TeamSummaryDto(pt.TeamId, pt.Team.Name)).ToList()
            ))
            .ToListAsync(ct);
    }
}