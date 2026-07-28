using Infera.Application.Common.Interfaces;
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
            .Select(t => new TeamDetailDto(
                t.Id, t.Name, t.Description, t.Creator.Name,
                t.Members.Select(m => new TeamMemberDetailDto(m.UserId, m.User.Name, m.TeamRole)).ToList()))
            .FirstOrDefaultAsync(ct);

        return team ?? throw new KeyNotFoundException("Takım bulunamadı.");
    }
}