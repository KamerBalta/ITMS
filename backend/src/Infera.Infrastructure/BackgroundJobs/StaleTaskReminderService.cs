using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infera.Infrastructure.BackgroundJobs;

public class StaleTaskReminderService : IStaleTaskReminderJob
{
    private const int StaleDays = 5;
    private readonly IAppDbContext _db;
    private readonly INotificationService _notificationService;

    public StaleTaskReminderService(IAppDbContext db, INotificationService notificationService)
    {
        _db = db;
        _notificationService = notificationService;
    }

    public async System.Threading.Tasks.Task RunAsync(CancellationToken ct)
    {
        var threshold = DateTime.UtcNow.AddDays(-StaleDays);

        // "InProgress" kategorisindeki durumlarda, StaleDays gündür UpdatedAt hiç değişmemiş görevler.
        var staleTasks = await _db.Tasks
            .Include(t => t.WorkflowStatus)
            .Include(t => t.Project)
            .Where(t => t.WorkflowStatus.Category == "InProgress" && t.UpdatedAt < threshold && t.AssigneeId != null)
            .ToListAsync(ct);

        foreach (var task in staleTasks)
        {
            var daysSinceUpdate = (int)(DateTime.UtcNow - (task.UpdatedAt ?? task.CreatedAt)).TotalDays;

            await _notificationService.NotifyAsync(
                task.AssigneeId!.Value,
                "Görev uzun süredir güncellenmiyor",
                $"\"{task.Title}\" görevi {daysSinceUpdate} gündür \"{task.WorkflowStatus.Name}\" durumunda hiç güncellenmedi.",
                NotificationType.Task,
                $"/tasks/{task.Id}",
                ct: ct);

            // Proje sahibine de bilgi ver -- ekip lideri görünürlük kazansın.
            await _notificationService.NotifyAsync(
                task.Project.OwnerId,
                "Ekipte bekleyen görev",
                $"\"{task.Title}\" görevi {daysSinceUpdate} gündür güncellenmedi ({task.Project.Name}).",
                NotificationType.Task,
                $"/tasks/{task.Id}",
                ct: ct);
        }
    }
}