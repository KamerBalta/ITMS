using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.AuditLogs.GetTaskAuditHistory;

public class GetTaskAuditHistoryQueryHandler : IRequestHandler<GetTaskAuditHistoryQuery, List<AuditHistoryItemDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;
    public GetTaskAuditHistoryQueryHandler(IAppDbContext db, IProjectAccessService access) { _db = db; _access = access; }

    public async System.Threading.Tasks.Task<List<AuditHistoryItemDto>> Handle(GetTaskAuditHistoryQuery request, CancellationToken ct)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Görev bulunamadı.");

        if (!await _access.HasProjectAccessAsync(task.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu göreve erişim yetkiniz yok.");

        return await _db.AuditLogs
            .Where(a => a.EntityType == "Task" && a.EntityId == request.TaskId && a.FieldName != null)
            .OrderByDescending(a => a.CreatedAt)
            .Take(50)
            .Select(a => new AuditHistoryItemDto(a.FieldName!, a.OldValue, a.NewValue, a.User.Name, a.CreatedAt))
            .ToListAsync(ct);
    }
}