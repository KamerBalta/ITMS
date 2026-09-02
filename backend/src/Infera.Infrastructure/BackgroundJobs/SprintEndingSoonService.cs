using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infera.Infrastructure.BackgroundJobs;

public class SprintEndingSoonService : ISprintEndingSoonJob
{
    private readonly IAppDbContext _db;
    private readonly INotificationService _notificationService;

    public SprintEndingSoonService(
        IAppDbContext db,
        INotificationService notificationService)
    {
        _db = db;
        _notificationService = notificationService;
    }

    public async System.Threading.Tasks.Task RunAsync(CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var warningWindowEnd = today.AddDays(2);

        var endingSprints = await _db.Sprints
            .Include(s => s.Project)
            .Where(s =>
                s.Status == SprintStatus.Active &&
                s.EndDate >= today &&
                s.EndDate <= warningWindowEnd)
            .ToListAsync(ct);

        foreach (var sprint in endingSprints)
        {
            var notStartedCount = await _db.Tasks
                .Include(t => t.WorkflowStatus)
                .Where(t =>
                    t.SprintId == sprint.Id &&
                    t.WorkflowStatus.Category == "ToDo")
                .CountAsync(ct);

            if (notStartedCount == 0) continue;

            await _notificationService.NotifyAsync(
                sprint.Project.OwnerId,
                "Sprint bitişi yaklaşıyor",
                $"\"{sprint.Name}\" sprinti {sprint.EndDate:dd.MM.yyyy} tarihinde bitiyor ve hâlâ {notStartedCount} görev başlanmadı.",
                NotificationType.Sprint,
                $"/sprints/{sprint.Id}",
                ct: ct);
        }
    }
}