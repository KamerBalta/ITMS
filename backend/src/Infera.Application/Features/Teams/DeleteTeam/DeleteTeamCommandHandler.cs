using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Teams.DeleteTeam;

public class DeleteTeamCommandHandler : IRequestHandler<DeleteTeamCommand>
{
    private readonly IAppDbContext _db;
    public DeleteTeamCommandHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task Handle(DeleteTeamCommand request, CancellationToken ct)
    {
        var team = await _db.Teams.FirstOrDefaultAsync(t => t.Id == request.TeamId, ct)
            ?? throw new KeyNotFoundException("Takım bulunamadı.");

        // BR-062: Herhangi bir projeye atanmis takim silinemez.
        var isAssignedToProject = await _db.ProjectTeams.AnyAsync(pt => pt.TeamId == request.TeamId, ct);
        if (isAssignedToProject)
            throw new InvalidOperationException("Bu takım bir veya daha fazla projeye atanmış durumda. Önce proje ilişkilerini kaldırın.");

        // BR-063: Aktif uyesi bulunan takim silinemez.
        var hasMembers = await _db.TeamMembers.AnyAsync(tm => tm.TeamId == request.TeamId, ct);
        if (hasMembers)
            throw new InvalidOperationException("Bu takımda hâlâ üyeler var. Önce tüm üyeleri takımdan çıkarın.");

        // BR-061: Bu noktaya kadar gelindiyse (controller zaten RequireAdmin policy'siyle korunuyor) silme islemi gerceklesir.
        _db.Teams.Remove(team);
        await _db.SaveChangesAsync(ct);
    }
}