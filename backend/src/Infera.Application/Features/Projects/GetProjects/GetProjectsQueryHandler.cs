using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Projects.GetProjects;

public class GetProjectsQueryHandler : IRequestHandler<GetProjectsQuery, List<ProjectDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetProjectsQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<List<ProjectDto>> Handle(GetProjectsQuery request, CancellationToken ct)
    {
        var accessibleIds = await _access.GetAccessibleProjectIdsAsync(ct);

        return await _db.Projects
            .Where(p => accessibleIds.Contains(p.Id))
            .Select(p => new ProjectDto(
                p.Id, p.Name, p.Key, p.Description,
                p.Owner.Name, p.Status.ToString(),
                p.ProjectTeams.Select(pt => new TeamSummaryDto(pt.TeamId, pt.Team.Name)).ToList()
            ))
            .ToListAsync(ct);
    }
}