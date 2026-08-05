using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Teams.AddTeamMember;

public class AddTeamMemberCommandHandler : IRequestHandler<AddTeamMemberCommand, Guid>
{
    // Frontend'deki TEAM_ROLE_OPTIONS ile birebir ayni liste -- iki tarafta da tutarli kalmali
    private static readonly HashSet<string> ValidTeamRoles = new()
    {
        "Team Lead", "Backend Developer", "Frontend Developer", "Full-stack Developer",
        "QA Lead", "QA Engineer", "DevOps Engineer", "UI/UX Designer", "Business Analyst",
    };

    private readonly IAppDbContext _db;
    public AddTeamMemberCommandHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<Guid> Handle(AddTeamMemberCommand request, CancellationToken ct)
    {
        var teamExists = await _db.Teams.AnyAsync(t => t.Id == request.TeamId, ct);
        if (!teamExists)
            throw new KeyNotFoundException("Takım bulunamadı.");

        var userExists = await _db.Users.AnyAsync(u => u.Id == request.UserId && u.IsActive, ct);
        if (!userExists)
            throw new KeyNotFoundException("Kullanıcı bulunamadı veya pasif.");

        if (!ValidTeamRoles.Contains(request.TeamRole))
            throw new InvalidOperationException($"Geçersiz takım rolü. İzin verilen değerler: {string.Join(", ", ValidTeamRoles)}");

        var alreadyMember = await _db.TeamMembers
            .AnyAsync(tm => tm.TeamId == request.TeamId && tm.UserId == request.UserId, ct);
        if (alreadyMember)
            throw new InvalidOperationException("Kullanıcı zaten bu takımın üyesi.");

        var member = new TeamMember
        {
            TeamId = request.TeamId,
            UserId = request.UserId,
            TeamRole = request.TeamRole
        };

        _db.TeamMembers.Add(member);
        await _db.SaveChangesAsync(ct);

        return member.Id;
    }
}