using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Notifications.MarkAsRead;

public class MarkAsReadCommandHandler : IRequestHandler<MarkAsReadCommand>
{
    private readonly IAppDbContext _db;
    public MarkAsReadCommandHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task Handle(MarkAsReadCommand request, CancellationToken ct)
    {
        var notification = await _db.Notifications
            .FirstOrDefaultAsync(n => n.Id == request.NotificationId, ct)
            ?? throw new KeyNotFoundException("Bildirim bulunamadı.");

        if (notification.UserId != request.UserId)
            throw new UnauthorizedAccessException("Bu bildirim size ait değil.");

        notification.IsRead = true;
        await _db.SaveChangesAsync(ct);
    }
}