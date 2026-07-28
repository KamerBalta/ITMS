using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Labels.AddLabelToTask;

public class AddLabelToTaskCommandHandler : IRequestHandler<AddLabelToTaskCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public AddLabelToTaskCommandHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task Handle(AddLabelToTaskCommand request, CancellationToken ct)
    {
        var taskExists = await _db.Tasks.AnyAsync(t => t.Id == request.TaskId, ct);
        if (!taskExists)
            throw new KeyNotFoundException("Görev bulunamadı.");

        if (!await _access.HasTaskAccessAsync(request.TaskId, ct))
            throw new UnauthorizedAccessException("Bu göreve etiket ekleme yetkiniz yok.");

        var labelExists = await _db.Labels.AnyAsync(l => l.Id == request.LabelId, ct);
        if (!labelExists)
            throw new KeyNotFoundException("Etiket bulunamadı.");

        var alreadyLinked = await _db.TaskLabels
            .AnyAsync(tl => tl.TaskId == request.TaskId && tl.LabelId == request.LabelId, ct);
        if (alreadyLinked)
            throw new InvalidOperationException("Bu etiket zaten göreve eklenmiş.");

        _db.TaskLabels.Add(new TaskLabel { TaskId = request.TaskId, LabelId = request.LabelId });
        await _db.SaveChangesAsync(ct);
    }
}