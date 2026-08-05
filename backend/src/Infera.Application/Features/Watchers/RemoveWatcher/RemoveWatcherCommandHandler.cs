using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Watchers.RemoveWatcher;

public class RemoveWatcherCommandHandler : IRequestHandler<RemoveWatcherCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public RemoveWatcherCommandHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task Handle(RemoveWatcherCommand request, CancellationToken ct)
    {
        var watcher = await _db.Watchers
            .FirstOrDefaultAsync(w => w.TaskId == request.TaskId && w.UserId == request.UserId, ct)
            ?? throw new KeyNotFoundException("İzleme kaydı bulunamadı.");

        if (!await _access.HasTaskAccessAsync(request.TaskId, ct))
            throw new UnauthorizedAccessException("Bu göreve erişim yetkiniz yok.");

        _db.Watchers.Remove(watcher);
        await _db.SaveChangesAsync(ct);
    }
}