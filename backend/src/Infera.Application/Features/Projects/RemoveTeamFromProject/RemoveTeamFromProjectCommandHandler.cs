using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Projects.RemoveTeamFromProject;

public class RemoveTeamFromProjectCommandHandler : IRequestHandler<RemoveTeamFromProjectCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public RemoveTeamFromProjectCommandHandler(
        IAppDbContext db,
        ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async System.Threading.Tasks.Task Handle(RemoveTeamFromProjectCommand request, CancellationToken ct)
    {
        var project = await _db.Projects
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId, ct)
            ?? throw new KeyNotFoundException("Proje bulunamadı.");

        if (!_currentUser.IsAdmin && project.OwnerId != _currentUser.UserId)
            throw new UnauthorizedAccessException("Bu projeden takım çıkarma yetkiniz yok.");

        var link = await _db.ProjectTeams
            .FirstOrDefaultAsync(
                pt => pt.ProjectId == request.ProjectId &&
                      pt.TeamId == request.TeamId,
                ct)
            ?? throw new KeyNotFoundException("Bu takım zaten bu projeye atanmamış.");

        // Önce proje üyelikleri temizlenmeli
        var hasProjectMembers = await _db.ProjectMembers
            .AnyAsync(
                m => m.ProjectId == request.ProjectId &&
                     m.TeamId == request.TeamId,
                ct);

        if (hasProjectMembers)
            throw new InvalidOperationException(
                "Bu takım üzerinden projeye eklenmiş üyeler var. Önce bu takımın proje üyeliklerini kaldırın.");

        // Son takım kontrolü kaldırıldı

        _db.ProjectTeams.Remove(link);

        await _db.SaveChangesAsync(ct);
    }
}