using Infera.Application.Common.Interfaces;
using Infera.Application.Common.Services;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Sprints.CompleteSprint;

public class CompleteSprintCommandHandler : IRequestHandler<CompleteSprintCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;
    private readonly INotificationService _notificationService;
    private readonly IRealtimeNotifier _realtime;
    private readonly ICurrentUserService _currentUser;
    private readonly IProjectPermissionService _permissionService;

    public CompleteSprintCommandHandler(
        IAppDbContext db,
        IProjectAccessService access,
        INotificationService notificationService,
        IRealtimeNotifier realtime,
        ICurrentUserService currentUser,
        IProjectPermissionService permissionService)
    {
        _db = db;
        _access = access;
        _notificationService = notificationService;
        _realtime = realtime;
        _currentUser = currentUser;
        _permissionService = permissionService;
    }

    public async System.Threading.Tasks.Task Handle(CompleteSprintCommand request, CancellationToken ct)
    {
        var sprint = await _db.Sprints.FirstOrDefaultAsync(s => s.Id == request.SprintId, ct)
            ?? throw new KeyNotFoundException("Sprint bulunamadı.");

        if (!await _access.HasProjectAccessAsync(sprint.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu sprinti tamamlama yetkiniz yok.");

        var isPrivileged = _currentUser.IsAdmin || _currentUser.Roles.Contains("Project Manager");
        if (!isPrivileged)
        {
            var developerCanManage = await _permissionService.IsOverrideEnabledAsync(sprint.ProjectId, "DeveloperCanManageSprints", ct);
            if (!developerCanManage)
                throw new UnauthorizedAccessException("Sprint tamamlama yetkiniz yok.");
        }

        if (sprint.Status == SprintStatus.Completed)
            throw new InvalidOperationException("Sprint zaten tamamlanmış.");

        var allTasks = await _db.Tasks.Where(t => t.SprintId == sprint.Id).ToListAsync(ct);

        // #4 fix: "taahhut edilen" puan, gorevler backlog'a tasinmadan ONCE, sprint'teki TUM
        // gorevlerin (Done olsun olmasin) toplami olarak donduruluyor -- Velocity grafiginin
        // dogru calismasi icin bu ana veri.
        sprint.CommittedStoryPoints = allTasks.Sum(t => t.StoryPoint ?? 0);

        var incompleteTasks = allTasks.Where(t => t.Status != ItemStatus.Done).ToList();
        foreach (var task in incompleteTasks)
        {
            task.SprintId = null;
            task.UpdatedAt = DateTime.UtcNow;
        }

        sprint.Status = SprintStatus.Completed;
        await _db.SaveChangesAsync(ct);

        var memberIds = await _db.ProjectMembers
            .Where(m => m.ProjectId == sprint.ProjectId)
            .Select(m => m.UserId)
            .Distinct()
            .ToListAsync(ct);

        foreach (var userId in memberIds)
        {
            await _notificationService.NotifyAsync(
                userId, "Sprint tamamlandı",
                $"\"{sprint.Name}\" sprinti tamamlandı." + (incompleteTasks.Count > 0
                    ? $" {incompleteTasks.Count} tamamlanmamış görev Backlog'a geri alındı."
                    : ""),
                NotificationType.Sprint, $"/sprints/{sprint.Id}", ct);
        }

        await _realtime.NotifyProjectAsync(sprint.ProjectId, "sprint", "completed", ct);
    }
}