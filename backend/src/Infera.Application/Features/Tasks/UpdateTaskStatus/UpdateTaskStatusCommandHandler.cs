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

    public UpdateTaskStatusCommandHandler(
        IAppDbContext db,
        ICurrentUserService currentUser,
        ITaskStatusTransitionService transitionService,
        INotificationService notificationService)
    {
        _db = db;
        _currentUser = currentUser;
        _transitionService = transitionService;
        _notificationService = notificationService;
    }

    public async System.Threading.Tasks.Task Handle(
        UpdateTaskStatusCommand request,
        CancellationToken ct)
    {
        var task = await _db.Tasks
            .FirstOrDefaultAsync(t => t.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Görev bulunamadı.");


        // Kullanıcının bu proje üzerindeki rolünü alıyoruz.
        // Roller JWT'den değil ProjectMembers üzerinden okunmalı.
        var roles = await _db.ProjectMembers
            .Where(pm =>
                pm.ProjectId == task.ProjectId &&
                pm.UserId == _currentUser.UserId)
            .Select(pm => pm.ProjectRole.ToString())
            .ToListAsync(ct);


        var (allowed, errorMessage) = _transitionService.CanTransition(
            task.Status,
            request.NewStatus,
            roles,
            _currentUser.IsAdmin);


        if (!allowed)
        {
            throw new UnauthorizedAccessException(
                errorMessage ?? "Bu durum geçişine izniniz yok.");
        }


        var oldStatus = task.Status;

        task.Status = request.NewStatus;
        task.UpdatedAt = DateTime.UtcNow;


        await _db.SaveChangesAsync(ct);


        // BR-014:
        // Durum değişikliği bildirimi atanan kullanıcıya gider.
        if (task.AssigneeId is not null &&
            task.AssigneeId != _currentUser.UserId)
        {
            await _notificationService.NotifyAsync(
    task.AssigneeId.Value,
    "Görev durumu değişti",
    $"\"{task.Title}\" adlı görevin durumu {oldStatus} → {request.NewStatus} olarak güncellendi.",
    NotificationType.Task,
    $"/tasks/{task.Id}",
    ct);
        }
    }
}