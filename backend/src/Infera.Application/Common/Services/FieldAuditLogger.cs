using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;

namespace Infera.Application.Common.Services;

public class FieldAuditLogger : IFieldAuditLogger
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public FieldAuditLogger(IAppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async System.Threading.Tasks.Task LogFieldChangeAsync(
        string entityType, Guid entityId, string fieldName, string? oldValue, string? newValue, CancellationToken ct = default)
    {
        // Deger degismemisse hicbir kayit tutma -- gereksiz gurultu olusturmasin
        if (oldValue == newValue) return;

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = _currentUser.UserId,
            EntityType = entityType,
            EntityId = entityId,
            Action = "FieldUpdate",
            FieldName = fieldName,
            OldValue = oldValue,
            NewValue = newValue,
            CreatedAt = DateTime.UtcNow,
        });

        await _db.SaveChangesAsync(ct);
    }
}