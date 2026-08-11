using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Teams.GetTeamById;

public class GetTeamByIdQueryHandler : IRequestHandler<GetTeamByIdQuery, TeamDetailDto>
{
    private readonly IAppDbContext _db;
    public GetTeamByIdQueryHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<TeamDetailDto> Handle(GetTeamByIdQuery request, CancellationToken ct)
    {
        var team = await _db.Teams
            .Where(t => t.Id == request.TeamId)
            .Select(t => new
            {
                t.Id,
                t.Name,
                t.Description,
                CreatedByName = t.Creator.Name,
                Members = t.Members.Select(m => new TeamMemberDetailDto(m.UserId, m.User.Name, m.TeamRole)).ToList()
            })
            .FirstOrDefaultAsync(ct);

        if (team is null)
            throw new KeyNotFoundException("Takım bulunamadı.");

        // #9: bu takimin atanmis oldugu, arsivlenmemis (aktif) projeler
        var activeProjects = await _db.ProjectTeams
            .Where(pt => pt.TeamId == request.TeamId && pt.Project.Status == ProjectStatus.Active)
            .Select(pt => pt.Project.Name)
            .ToListAsync(ct);

        return new TeamDetailDto(team.Id, team.Name, team.Description, team.CreatedByName, team.Members, activeProjects);
    }
}