using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Watchers.AddWatcher;

public class AddWatcherCommandHandler : IRequestHandler<AddWatcherCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public AddWatcherCommandHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task Handle(AddWatcherCommand request, CancellationToken ct)
    {
        var taskExists = await _db.Tasks.AnyAsync(t => t.Id == request.TaskId, ct);
        if (!taskExists)
            throw new KeyNotFoundException("Görev bulunamadı.");

        if (!await _access.HasTaskAccessAsync(request.TaskId, ct))
            throw new UnauthorizedAccessException("Bu görevi izleme yetkiniz yok.");

        var alreadyWatching = await _db.Watchers
            .AnyAsync(w => w.TaskId == request.TaskId && w.UserId == request.UserId, ct);
        if (alreadyWatching)
            throw new InvalidOperationException("Bu görevi zaten izliyorsunuz.");

        _db.Watchers.Add(new Watcher { TaskId = request.TaskId, UserId = request.UserId });
        await _db.SaveChangesAsync(ct);
    }
}