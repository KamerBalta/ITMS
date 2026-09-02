using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.AuditLogs.GetTaskAuditHistory;

public class GetTaskAuditHistoryQueryHandler : IRequestHandler<GetTaskAuditHistoryQuery, List<AuditHistoryItemDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetTaskAuditHistoryQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<List<AuditHistoryItemDto>> Handle(GetTaskAuditHistoryQuery request, CancellationToken ct)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Görev bulunamadı.");

        if (!await _access.HasProjectAccessAsync(task.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu göreve erişim yetkiniz yok.");

        var rawItems = await _db.AuditLogs
            .Where(a => a.EntityType == "Task" && a.EntityId == request.TaskId && a.FieldName != null)
          .OrderByDescending(a => a.CreatedAt)
.Take(50)
.Select(a => new
{
    a.FieldName,
    a.OldValue,
    a.NewValue,
    UserName = a.User.Name,
    a.CreatedAt
})
            .ToListAsync(ct);

        // #1: Yalnizca AssigneeId alani ham Guid tasiyor -- diger tum alanlar zaten
        // okunabilir string (Priority, StoryPoint vb.). Bu yuzden yalnizca bu alan icin
        // gecen tum Guid'leri toplu olarak kullanici adina cozumluyoruz.
        var assigneeGuids = rawItems
            .Where(i => i.FieldName == "AssigneeId")
            .SelectMany(i => new[] { i.OldValue, i.NewValue })
            .Where(v => !string.IsNullOrEmpty(v) && Guid.TryParse(v, out _))
            .Select(v => Guid.Parse(v!))
            .Distinct()
            .ToList();

        var userNames = assigneeGuids.Count > 0
            ? await _db.Users.Where(u => assigneeGuids.Contains(u.Id)).ToDictionaryAsync(u => u.Id, u => u.Name, ct)
            : new Dictionary<Guid, string>();

        string? Resolve(string? fieldName, string? value)
        {
            if (fieldName == "AssigneeId" && !string.IsNullOrEmpty(value) && Guid.TryParse(value, out var id))
                return userNames.TryGetValue(id, out var name) ? name : "(silinmiş kullanıcı)";
            return value;
        }

        return rawItems
            .Select(i => new AuditHistoryItemDto(
    i.FieldName!,
    Resolve(i.FieldName, i.OldValue),
    Resolve(i.FieldName, i.NewValue),
    i.UserName,
    i.CreatedAt))
            .ToList();
    }
}