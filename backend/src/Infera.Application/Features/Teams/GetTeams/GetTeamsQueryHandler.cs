using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Teams.GetTeams;

public class GetTeamsQueryHandler : IRequestHandler<GetTeamsQuery, List<TeamDto>>
{
    private readonly IAppDbContext _db;
    public GetTeamsQueryHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<List<TeamDto>> Handle(GetTeamsQuery request, CancellationToken ct)
    {
        return await _db.Teams
            .Select(t => new TeamDto(
                t.Id,
                t.Name,
                t.Description,
                t.Members.Select(m => new TeamMemberDto(m.UserId, m.User.Name, m.TeamRole)).ToList()
            ))
            .ToListAsync(ct);
    }
}