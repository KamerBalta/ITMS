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

        _db.Tasks.Remove(task);
        await _db.SaveChangesAsync(ct);
    }
}