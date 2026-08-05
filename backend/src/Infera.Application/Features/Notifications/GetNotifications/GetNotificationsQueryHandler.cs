using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Notifications.GetNotifications;

public class GetNotificationsQueryHandler : IRequestHandler<GetNotificationsQuery, List<NotificationDto>>
{
    private readonly IAppDbContext _db;
    public GetNotificationsQueryHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<List<NotificationDto>> Handle(GetNotificationsQuery request, CancellationToken ct)
    {
        return await _db.Notifications
            .Where(n => n.UserId == request.UserId)
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new NotificationDto(
                n.Id,
                n.Title,
                n.Message,
                n.Type.ToString(),
                n.IsRead,
                n.CreatedAt,
                n.ActionUrl))
            .ToListAsync(ct);
    }
}