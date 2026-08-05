using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Notifications.DeleteNotification;

public class DeleteNotificationCommandHandler : IRequestHandler<DeleteNotificationCommand>
{
    private readonly IAppDbContext _db;
    public DeleteNotificationCommandHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task Handle(DeleteNotificationCommand request, CancellationToken ct)
    {
        var notification = await _db.Notifications
            .FirstOrDefaultAsync(n => n.Id == request.NotificationId, ct)
            ?? throw new KeyNotFoundException("Bildirim bulunamadı.");

        if (notification.UserId != request.UserId)
            throw new UnauthorizedAccessException("Bu bildirim size ait değil.");

        _db.Notifications.Remove(notification);
        await _db.SaveChangesAsync(ct);
    }
}