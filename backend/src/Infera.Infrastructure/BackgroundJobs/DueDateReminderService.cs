using Infera.Domain.Enums;
using Infera.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Infera.Infrastructure.BackgroundJobs;

// BR-014: yaklasan teslim tarihi bildirimi -- periyodik olarak calisir.
// Not: Faz 1'de basit bir IHostedService/Timer kullaniyoruz; Faz 2'de coklu API instance'i
// calisirsa (yatay olcekleme) bu isin bir Job scheduler'a (Hangfire/Quartz) tasinmasi gerekir,
// aksi halde her instance ayni bildirimleri tekrar tekrar denemeye calisir (DueDateReminderSentAt
// alani sayesinde cift bildirim gitmez ama gereksiz sorgu yukü olur).
public class DueDateReminderService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<DueDateReminderService> _logger;
    private static readonly TimeSpan CheckInterval = TimeSpan.FromMinutes(30);

    public DueDateReminderService(IServiceScopeFactory scopeFactory, ILogger<DueDateReminderService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CheckAndNotifyAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "DueDateReminderService çalışırken hata oluştu.");
            }

            await Task.Delay(CheckInterval, stoppingToken);
        }
    }

    private async Task CheckAndNotifyAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var notificationService = scope.ServiceProvider.GetRequiredService<Application.Common.Interfaces.INotificationService>();

        var now = DateTime.UtcNow;
        var next24h = now.AddHours(24);

        var dueSoonTasks = await db.Tasks
            .Where(t =>
                t.DueDate != null && t.DueDate >= now && t.DueDate <= next24h &&
                t.Status != ItemStatus.Done && t.Status != ItemStatus.Closed &&
                t.DueDateReminderSentAt == null &&
                t.AssigneeId != null)
            .ToListAsync(ct);

        foreach (var task in dueSoonTasks)
        {
            await notificationService.NotifyAsync(
    task.AssigneeId!.Value,
    "Yaklaşan teslim tarihi",
    $"\"{task.Title}\" adlı görevin teslim tarihi 24 saat içinde ({task.DueDate:dd.MM.yyyy HH:mm}).",
    NotificationType.Task,
    $"/tasks/{task.Id}",
    ct);
            task.DueDateReminderSentAt = now;
        }

        if (dueSoonTasks.Count > 0)
            await db.SaveChangesAsync(ct);
    }
}