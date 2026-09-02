using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infera.Infrastructure.BackgroundJobs;

public class ComponentLeadDigestService : IComponentLeadDigestJob
{
    private readonly IAppDbContext _db;
    private readonly INotificationService _notificationService;

    public ComponentLeadDigestService(IAppDbContext db, INotificationService notificationService)
    {
        _db = db;
        _notificationService = notificationService;
    }

    public async System.Threading.Tasks.Task RunAsync(CancellationToken ct)
    {
        var componentsWithLead = await _db.ProjectComponents
            .Where(c => c.LeadUserId != null)
            .ToListAsync(ct);

        foreach (var component in componentsWithLead)
        {
            var openTaskCount = await _db.TaskComponents
                .Include(tc => tc.Task).ThenInclude(t => t.WorkflowStatus)
                .Where(tc => tc.ProjectComponentId == component.Id && tc.Task.WorkflowStatus.Category != "Done")
                .CountAsync(ct);

            if (openTaskCount == 0) continue;

            await _notificationService.NotifyAsync(
                component.LeadUserId!.Value,
                "Component özetiniz",
                $"\"{component.Name}\" component'inde şu anda {openTaskCount} açık görev bulunuyor.",
                NotificationType.Task,
                $"/projects/{component.ProjectId}/components",
                isImportant: false,
                ct: ct);
        }
    }
}