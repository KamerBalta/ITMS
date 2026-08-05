using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Tasks.DeleteTask;

public class DeleteTaskCommandHandler : IRequestHandler<DeleteTaskCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public DeleteTaskCommandHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task Handle(DeleteTaskCommand request, CancellationToken ct)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Görev bulunamadı.");

        if (!await _access.HasProjectAccessAsync(task.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu görevi silme yetkiniz yok.");

        var hasSubtasks = await _db.Tasks.AnyAsync(t => t.ParentTaskId == request.TaskId, ct);
        if (hasSubtasks)
            throw new InvalidOperationException("Alt görevleri olan bir görev silinemez, önce alt görevleri silin.");

        // Task soft-delete oluyor ama Watcher/TaskLabel hard-delete kalan tablolar --
        // bunlari da burada temizleyelim ki DB'de oksuz kayit birikmesin.
        var watchers = await _db.Watchers.Where(w => w.TaskId == request.TaskId).ToListAsync(ct);
        _db.Watchers.RemoveRange(watchers);

        var taskLabels = await _db.TaskLabels.Where(tl => tl.TaskId == request.TaskId).ToListAsync(ct);
        _db.TaskLabels.RemoveRange(taskLabels);

        _db.Tasks.Remove(task);
        await _db.SaveChangesAsync(ct);
    }
}