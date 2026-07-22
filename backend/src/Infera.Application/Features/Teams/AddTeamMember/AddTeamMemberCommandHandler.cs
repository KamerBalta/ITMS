using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Teams.AddTeamMember;

public class AddTeamMemberCommandHandler : IRequestHandler<AddTeamMemberCommand, Guid>
{
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