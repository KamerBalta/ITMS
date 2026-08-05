using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Tasks.CloseEpic;

public class CloseEpicCommandHandler : IRequestHandler<CloseEpicCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public CloseEpicCommandHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task Handle(CloseEpicCommand request, CancellationToken ct)
    {
        var epic = await _db.Tasks.Include(t => t.IssueType).FirstOrDefaultAsync(t => t.Id == request.EpicId, ct)
            ?? throw new KeyNotFoundException("Görev bulunamadı.");

        if (epic.IssueType is null || !epic.IssueType.AllowsChildren)
            throw new InvalidOperationException("Yalnızca 'üst görev olabilir' (Epic benzeri) tipteki görevler kapatılabilir.");

        if (!await _access.HasProjectAccessAsync(epic.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu görevi kapatma yetkiniz yok.");

        var children = await _db.Tasks
            .Where(t => t.ParentTaskId == request.EpicId)
            .Select(t => t.Status)
            .ToListAsync(ct);

        if (children.Count == 0)
            throw new InvalidOperationException("Bu göreve bağlı hiçbir alt görev yok, kapatılamaz.");

        var incompleteCount = children.Count(s => s != ItemStatus.Done);
        if (incompleteCount > 0)
            throw new InvalidOperationException(
                $"Kapatılamaz: bağlı {children.Count} görevden {incompleteCount} tanesi henüz Done durumunda değil.");

        epic.Status = ItemStatus.Closed;
        epic.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
    }
}