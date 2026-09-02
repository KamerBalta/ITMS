using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infera.Infrastructure.BackgroundJobs;

public class OverdueSprintReminderService : IOverdueSprintReminderJob
{
    private readonly IAppDbContext _db;
    private readonly INotificationService _notificationService;

    public OverdueSprintReminderService(
        IAppDbContext db,
        INotificationService notificationService)
    {
        _db = db;
        _notificationService = notificationService;
    }

    public async System.Threading.Tasks.Task RunAsync(CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var overdueSprints = await _db.Sprints
            .Include(s => s.Project)
            .Where(s =>
                s.Status == SprintStatus.Active &&
                s.EndDate < today)
            .ToListAsync(ct);

        foreach (var sprint in overdueSprints)
        {
            var daysOverdue = today.DayNumber - sprint.EndDate.DayNumber;

            await _notificationService.NotifyAsync(
                sprint.Project.OwnerId,
                "Sprint bitiş tarihi geçti",
                $"\"{sprint.Name}\" sprintinin bitiş tarihi {daysOverdue} gün önce geçti ama sprint hâlâ aktif. Tamamlamayı unutmayın.",
                NotificationType.Sprint,
                $"/sprints/{sprint.Id}",
                ct: ct);
        }
    }
}