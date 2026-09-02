using Infera.Application.Common.Extensions;
using Infera.Application.Common.Interfaces;
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
    private readonly ICacheService _cache;
    private readonly IAutomationEngine _automationEngine;

    public UpdateTaskStatusCommandHandler(
        IAppDbContext db,
        ICurrentUserService currentUser,
        ITaskStatusTransitionService transitionService,
        INotificationService notificationService,
        IRealtimeNotifier realtime,
        ICacheService cache,
        IAutomationEngine automationEngine)
    {
        _db = db;
        _currentUser = currentUser;
        _transitionService = transitionService;
        _notificationService = notificationService;
        _realtime = realtime;
        _cache = cache;
        _automationEngine = automationEngine;
    }

    public async System.Threading.Tasks.Task Handle(UpdateTaskStatusCommand request, CancellationToken ct)
    {
        var task = await _db.Tasks.Include(t => t.WorkflowStatus).FirstOrDefaultAsync(t => t.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Görev bulunamadı.");

        if (request.NewStatusId == Guid.Empty)
            throw new InvalidOperationException("Geçersiz durum seçimi (boş ID gönderildi). Sayfayı yenileyip tekrar deneyin.");

        // #Detail-Fix: hedef durumu ARTIK PROJE BAZLI ariyoruz -- oncesinde ProjectId filtresi
        // yoktu, "bulunamadi" hatasi hem "hic yok" hem "yanlis projeye ait" durumlarini
        // ayni belirsiz mesajla gizliyordu. Simdi ikisini ayirt ediyoruz.
        var newStatus = await _db.ProjectWorkflowStatuses.FirstOrDefaultAsync(s => s.Id == request.NewStatusId, ct);
        if (newStatus is null)
            throw new KeyNotFoundException($"Belirtilen durum sistemde bulunamadı (ID: {request.NewStatusId}). Sayfayı yenileyip tekrar deneyin.");
        if (newStatus.ProjectId != task.ProjectId)
            throw new InvalidOperationException("Bu durum, görevin ait olduğu projeye tanımlı değil.");
        if (newStatus.IsDraft)
            throw new InvalidOperationException("Bu durum henüz yayınlanmamış (taslak). Workflow Editörü'nden yayınlanmasını bekleyin.");

        var isPrivileged = _currentUser.IsAdmin || _currentUser.Roles.Contains("Project Manager");
        var isAssignee = isPrivileged || task.AssigneeId == _currentUser.UserId;

        var (allowed, errorMessage) = await _transitionService.CanTransitionAsync(
            task.ProjectId, task.StatusId, request.NewStatusId, _currentUser.Roles, _currentUser.IsAdmin, isAssignee, ct);

        if (!allowed)
            throw new UnauthorizedAccessException(errorMessage ?? "Bu durum geçişine izniniz yok.");

        var oldStatusName = task.WorkflowStatus.Name;
        task.StatusId = request.NewStatusId;
        task.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesWithConcurrencyCheckAsync(ct);

        if (task.AssigneeId is not null && task.AssigneeId != _currentUser.UserId)
        {
            await _notificationService.NotifyAsync(
                task.AssigneeId.Value,
                "Görev durumu değişti",
                $"\"{task.Title}\" adlı görevin durumu {oldStatusName} → {newStatus.Name} olarak güncellendi.",
                NotificationType.Task,
                $"/tasks/{task.Id}",
                ct: ct);
        }

        await _realtime.NotifyProjectAsync(task.ProjectId, "task", "status-changed", ct);
        await _cache.RemoveByPrefixAsync($"dashboard:{task.ProjectId}:", ct);
        await _automationEngine.ProcessStatusChangedAsync(task.Id, newStatus.Name, ct);
    }
}