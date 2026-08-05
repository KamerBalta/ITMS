using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Notifications.MarkAllAsRead;

public class MarkAllAsReadCommandHandler : IRequestHandler<MarkAllAsReadCommand>
{
    private readonly IAppDbContext _db;
    public MarkAllAsReadCommandHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task Handle(MarkAllAsReadCommand request, CancellationToken ct)
    {
        var unread = await _db.Notifications
            .Where(n => n.UserId == request.UserId && !n.IsRead)
            .ToListAsync(ct);

        foreach (var n in unread)
            n.IsRead = true;

        await _db.SaveChangesAsync(ct);
    }
}