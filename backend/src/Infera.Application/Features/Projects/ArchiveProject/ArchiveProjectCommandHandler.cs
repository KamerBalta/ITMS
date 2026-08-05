using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Projects.ArchiveProject;

public class ArchiveProjectCommandHandler : IRequestHandler<ArchiveProjectCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public ArchiveProjectCommandHandler(IAppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async System.Threading.Tasks.Task Handle(ArchiveProjectCommand request, CancellationToken ct)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.Id == request.ProjectId, ct)
            ?? throw new KeyNotFoundException("Proje bulunamadı.");

        if (!_currentUser.IsAdmin && project.OwnerId != _currentUser.UserId)
            throw new UnauthorizedAccessException("Bu projeyi arşivleme yetkiniz yok.");

        // BR-013: Aktif Sprint bulunan projeler arsivlenemez.
        var hasActiveSprint = await _db.Sprints
            .AnyAsync(s => s.ProjectId == request.ProjectId && s.Status == SprintStatus.Active, ct);

        if (hasActiveSprint)
            throw new InvalidOperationException("Aktif sprint(ler) bulunan bir proje arşivlenemez. Önce tüm sprint'leri tamamlayın.");

        project.Status = ProjectStatus.Archived;
        await _db.SaveChangesAsync(ct);
    }
}