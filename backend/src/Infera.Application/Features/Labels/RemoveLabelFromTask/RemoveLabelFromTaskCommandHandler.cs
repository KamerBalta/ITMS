using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Labels.RemoveLabelFromTask;

public class RemoveLabelFromTaskCommandHandler : IRequestHandler<RemoveLabelFromTaskCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public RemoveLabelFromTaskCommandHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task Handle(RemoveLabelFromTaskCommand request, CancellationToken ct)
    {
        var link = await _db.TaskLabels
            .FirstOrDefaultAsync(tl => tl.TaskId == request.TaskId && tl.LabelId == request.LabelId, ct)
            ?? throw new KeyNotFoundException("Bu etiket görevde bulunamadı.");

        if (!await _access.HasTaskAccessAsync(request.TaskId, ct))
            throw new UnauthorizedAccessException("Bu göreve erişim yetkiniz yok.");

        _db.TaskLabels.Remove(link);
        await _db.SaveChangesAsync(ct);
    }
}