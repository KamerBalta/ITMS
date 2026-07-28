using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Backlog.RemoveFromSprint;

public class RemoveFromSprintCommandHandler
    : IRequestHandler<RemoveFromSprintCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IProjectAccessService _access;

    public RemoveFromSprintCommandHandler(
        IAppDbContext db,
        ICurrentUserService currentUser,
        IProjectAccessService access)
    {
        _db = db;
        _currentUser = currentUser;
        _access = access;
    }

    public async System.Threading.Tasks.Task Handle(
        RemoveFromSprintCommand request,
        CancellationToken ct)
    {
        var task = await _db.Tasks
            .Include(t => t.Sprint)
            .FirstOrDefaultAsync(t => t.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Görev bulunamadı.");

        if (!await _access.HasProjectAccessAsync(task.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu görevi çıkarma yetkiniz yok.");

        if (task.Sprint != null &&
            task.Sprint.Status == SprintStatus.Active &&
            !_currentUser.IsAdmin)
        {
            throw new UnauthorizedAccessException(
                "Aktif sprintten görev çıkarma yetkiniz yok.");
        }

        task.SprintId = null;
        task.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
    }
}