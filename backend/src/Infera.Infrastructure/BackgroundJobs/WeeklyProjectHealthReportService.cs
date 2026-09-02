using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infera.Infrastructure.BackgroundJobs;

public class WeeklyProjectHealthReportService : IWeeklyProjectHealthReportJob
{
    private readonly IAppDbContext _db;
    private readonly IEmailService _emailService;

    public WeeklyProjectHealthReportService(IAppDbContext db, IEmailService emailService)
    {
        _db = db;
        _emailService = emailService;
    }

    public async System.Threading.Tasks.Task RunAsync(CancellationToken ct)
    {
        var weekAgo = DateTime.UtcNow.AddDays(-7);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var activeProjects = await _db.Projects
            .Where(p => p.Status == ProjectStatus.Active)
            .ToListAsync(ct);

        foreach (var project in activeProjects)
        {
            var owner = await _db.Users.FirstOrDefaultAsync(u => u.Id == project.OwnerId, ct);
            if (owner is null || !owner.IsActive) continue;

            var completedThisWeek = await _db.Tasks
                .Include(t => t.WorkflowStatus)
                .Where(t =>
                    t.ProjectId == project.Id &&
                    t.WorkflowStatus.Category == "Done" &&
                    t.UpdatedAt >= weekAgo)
                .CountAsync(ct);

            var openBugs = await _db.Tasks
                .Include(t => t.WorkflowStatus)
                .Include(t => t.IssueType)
                .Where(t =>
                    t.ProjectId == project.Id &&
                    t.WorkflowStatus.Category != "Done" &&
                    t.IssueType!.Name == "Bug")
                .CountAsync(ct);

            var overdueCount = await _db.Tasks
                .Include(t => t.WorkflowStatus)
                .Where(t =>
                    t.ProjectId == project.Id &&
                    t.WorkflowStatus.Category != "Done" &&
                    t.DueDate != null &&
                    t.DueDate < today)
                .CountAsync(ct);

            if (completedThisWeek == 0 && openBugs == 0 && overdueCount == 0) continue;

            var body =
                $"Bu hafta {completedThisWeek} görev tamamlandı. " +
                $"Şu anda {openBugs} açık bug ve {overdueCount} geciken görev bulunuyor.";

            await _emailService.SendHtmlAsync(
                owner.Email,
                $"Haftalık Özet — {project.Name}",
                $"{project.Name} — Haftalık Sağlık Raporu",
                body,
                null,
                null,
                ct);
        }
    }
}