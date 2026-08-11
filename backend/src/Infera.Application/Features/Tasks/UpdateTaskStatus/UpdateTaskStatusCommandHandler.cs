using Infera.Application.Common.Interfaces;
using Infera.Application.Common.Services;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Tasks.UpdateTaskStatus;

public class UpdateTaskStatusCommandHandler : IRequestHandler<UpdateTaskStatusCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly ITaskStatusTransitionService _transitionService;
    private readonly INotificationService _notificationService;
    private readonly IRealtimeNotifier _realtime;
    private readonly IAutomationEngine _automationEngine;

    public UpdateTaskStatusCommandHandler(
        IAppDbContext db,
        ICurrentUserService currentUser,
        ITaskStatusTransitionService transitionService,
        INotificationService notificationService,
        IRealtimeNotifier realtime,
        IAutomationEngine automationEngine)
    {
        _db = db;
        _currentUser = currentUser;
        _transitionService = transitionService;
        _notificationService = notificationService;
        _realtime = realtime;
        _automationEngine = automationEngine;
    }

    public async System.Threading.Tasks.Task Handle(UpdateTaskStatusCommand request, CancellationToken ct)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Görev bulunamadı.");

        // RequireAssigneeSelf kontrolu icin: PM/Admin rolu zaten AllowedRoles'ta olacagi icin
        // "atanan kisi degilim" diye reddedilmemeleri lazim -- bu yuzden PM/Admin ise isAssignee'yi true kabul ediyoruz.
        var isPrivileged = _currentUser.IsAdmin || _currentUser.Roles.Contains("Project Manager");
        var isAssignee = isPrivileged || task.AssigneeId == _currentUser.UserId;

        var (allowed, errorMessage) = await _transitionService.CanTransitionAsync(
            task.ProjectId, task.Status, request.NewStatus, _currentUser.Roles, _currentUser.IsAdmin, isAssignee, ct);

        if (!allowed)
            throw new UnauthorizedAccessException(errorMessage ?? "Bu durum geçişine izniniz yok.");

        var oldStatus = task.Status;
        task.Status = request.NewStatus;
        task.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        if (task.AssigneeId is not null && task.AssigneeId != _currentUser.UserId)
        {
            await _notificationService.NotifyAsync(
                task.AssigneeId.Value, "Görev durumu değişti",
                $"\"{task.Title}\" adlı görevin durumu {oldStatus} → {request.NewStatus} olarak güncellendi.",
                NotificationType.Task, $"/tasks/{task.Id}", ct);
        }

        await _realtime.NotifyProjectAsync(task.ProjectId, "task", "status-changed", ct);
        await _automationEngine.ProcessStatusChangedAsync(task.Id, request.NewStatus.ToString(), ct);
    }
}