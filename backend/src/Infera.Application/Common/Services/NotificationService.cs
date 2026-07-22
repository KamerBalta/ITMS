using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using Infera.Domain.Enums;

namespace Infera.Application.Common.Services;

public class NotificationService : INotificationService
{
    private readonly IAppDbContext _db;
    public NotificationService(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task NotifyAsync(
        Guid userId, string title, string message, NotificationType type, CancellationToken ct = default)
    {
        _db.Notifications.Add(new Notification
        {
            UserId = userId,
            Title = title,
            Message = message,
            Type = type,
            IsRead = false
        });
        await _db.SaveChangesAsync(ct);
    }
}