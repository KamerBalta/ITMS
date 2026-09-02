using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infera.Infrastructure.BackgroundJobs;

public class BacklogGroomingReminderService : IBacklogGroomingReminderJob
{
    private const int BacklogSizeThreshold = 100;
    private const int NoEstimateThreshold = 20;

    private readonly IAppDbContext _db;
    private readonly INotificationService _notificationService;

    public BacklogGroomingReminderService(IAppDbContext db, INotificationService notificationService)
    {
        _db = db;
        _notificationService = notificationService;
    }

    public async System.Threading.Tasks.Task RunAsync(CancellationToken ct)
    {
        var activeProjects = await _db.Projects.Where(p => p.Status == ProjectStatus.Active).ToListAsync(ct);

        foreach (var project in activeProjects)
        {
            var backlogTasks = await _db.Tasks
                .Where(t => t.ProjectId == project.Id && t.SprintId == null)
                .Select(t => new { t.StoryPoint })
                .ToListAsync(ct);

            var totalCount = backlogTasks.Count;
            var noEstimateCount = backlogTasks.Count(t => t.StoryPoint == null);

            var needsGrooming = totalCount > BacklogSizeThreshold || noEstimateCount > NoEstimateThreshold;
            if (!needsGrooming) continue;

            await _notificationService.NotifyAsync(
                project.OwnerId,
                "Backlog grooming zamanı",
                $"\"{project.Name}\" backlog'unda {totalCount} görev var, bunların {noEstimateCount} tanesi story point'siz. Gözden geçirmeyi düşünün.",
                NotificationType.Task,
                "/backlog",
                isImportant: false,
                ct: ct);
        }
    }
}