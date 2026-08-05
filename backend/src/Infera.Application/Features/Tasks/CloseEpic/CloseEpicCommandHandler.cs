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
        var epic = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == request.EpicId, ct)
            ?? throw new KeyNotFoundException("Epic bulunamadı.");

        if (epic.IssueType != IssueType.Epic)
            throw new InvalidOperationException("Yalnızca Epic tipindeki görevler kapatılabilir.");

        if (!await _access.HasProjectAccessAsync(epic.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu Epic'i kapatma yetkiniz yok.");

        // BR-005: Epic'e bagli tum Story/Task/Bug/Sub-task Done olmadan Closed'a gecemez.
        var children = await _db.Tasks
            .Where(t => t.ParentTaskId == request.EpicId)
            .Select(t => t.Status)
            .ToListAsync(ct);

        if (children.Count == 0)
            throw new InvalidOperationException("Bu Epic'e bağlı hiçbir görev yok, kapatılamaz.");

        var incompleteCount = children.Count(s => s != ItemStatus.Done);
        if (incompleteCount > 0)
            throw new InvalidOperationException(
                $"Epic kapatılamaz: bağlı {children.Count} görevden {incompleteCount} tanesi henüz Done durumunda değil.");

        epic.Status = ItemStatus.Closed;
        epic.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
    }
}