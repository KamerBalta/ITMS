using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infera.Infrastructure.BackgroundJobs;

public class InactiveUserDetectionService : IInactiveUserDetectionJob
{
    private const int InactivityDays = 60;
    private readonly IAppDbContext _db;
    private readonly INotificationService _notificationService;

    public InactiveUserDetectionService(IAppDbContext db, INotificationService notificationService)
    {
        _db = db;
        _notificationService = notificationService;
    }

    public async System.Threading.Tasks.Task RunAsync(CancellationToken ct)
    {
        var threshold = DateTime.UtcNow.AddDays(-InactivityDays);

        var inactiveUsers = await _db.Users
            .Where(u => u.IsActive && !u.MustChangePassword &&
                        (u.LastLoginAt == null ? u.CreatedAt : u.LastLoginAt) < threshold)
            .CountAsync(ct);

        if (inactiveUsers == 0) return;

        var admins = await _db.UserRoles
            .Where(ur => ur.Role.Name == "System Admin")
            .Select(ur => ur.UserId)
            .ToListAsync(ct);

        foreach (var adminId in admins)
        {
            await _notificationService.NotifyAsync(
                adminId,
                "İnaktif kullanıcı tespiti",
                $"{inactiveUsers} kullanıcı {InactivityDays} gündür sisteme giriş yapmadı. Kullanıcı Yönetimi'nden gözden geçirebilirsiniz.",
                NotificationType.Task,
                "/admin/users",
                isImportant: false,
                ct: ct);
        }
    }
}