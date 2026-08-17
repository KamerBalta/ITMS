using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infera.Infrastructure.BackgroundJobs;

public class DueDateReminderService : IDueDateReminderJob
{
    private readonly IAppDbContext _db;
    private readonly INotificationService _notificationService;

    public DueDateReminderService(
        IAppDbContext db,
        INotificationService notificationService)
    {
        _db = db;
        _notificationService = notificationService;
    }

    public async System.Threading.Tasks.Task RunAsync(CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var tomorrow = today.AddDays(1);

        var dueSoonTasks = await _db.Tasks
            .Where(t =>
                t.DueDate != null &&
                t.DueDate >= today &&
                t.DueDate <= tomorrow &&
                t.Status != ItemStatus.Done &&
                t.Status != ItemStatus.Closed &&
                t.DueDateReminderSentAt == null &&
                t.AssigneeId != null)
            .ToListAsync(ct);

        foreach (var task in dueSoonTasks)
        {
            await _notificationService.NotifyAsync(
                task.AssigneeId!.Value,
                "Yaklaşan teslim tarihi",
                $"\"{task.Title}\" adlı görevin teslim tarihi yaklaşıyor ({task.DueDate:dd.MM.yyyy}).",
                NotificationType.Task,
                $"/tasks/{task.Id}",
                ct);

            task.DueDateReminderSentAt = DateTime.UtcNow;
        }

        if (dueSoonTasks.Count > 0)
            await _db.SaveChangesAsync(ct);
    }
}