using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Projects.UnarchiveProject;

public class UnarchiveProjectCommandHandler : IRequestHandler<UnarchiveProjectCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public UnarchiveProjectCommandHandler(IAppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async System.Threading.Tasks.Task Handle(UnarchiveProjectCommand request, CancellationToken ct)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.Id == request.ProjectId, ct)
            ?? throw new KeyNotFoundException("Proje bulunamadı.");

        if (!_currentUser.IsAdmin && project.OwnerId != _currentUser.UserId)
            throw new UnauthorizedAccessException("Bu projeyi arşivden çıkarma yetkiniz yok.");

        if (project.Status != ProjectStatus.Archived)
            throw new InvalidOperationException("Proje zaten arşivde değil.");

        project.Status = ProjectStatus.Active;
        await _db.SaveChangesAsync(ct);
    }
}