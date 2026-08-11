using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Tasks.ReassignTask;

public class ReassignTaskCommandHandler : IRequestHandler<ReassignTaskCommand>
{
    private readonly IAppDbContext _db;
    private readonly INotificationService _notificationService;
    private readonly IRealtimeNotifier _realtime;

    public ReassignTaskCommandHandler(
        IAppDbContext db,
        INotificationService notificationService,
        IRealtimeNotifier realtime)
    {
        _db = db;
        _notificationService = notificationService;
        _realtime = realtime;
    }

    public async System.Threading.Tasks.Task Handle(ReassignTaskCommand request, CancellationToken ct)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Görev bulunamadı.");

        if (request.NewAssigneeId is not null)
        {
            var isMember = await _db.ProjectMembers
                .AnyAsync(m => m.ProjectId == task.ProjectId && m.UserId == request.NewAssigneeId, ct);
            if (!isMember)
                throw new InvalidOperationException("Atanan kullanıcı bu projenin üyesi değil.");
        }

        task.AssigneeId = request.NewAssigneeId;
        task.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        await _realtime.NotifyProjectAsync(task.ProjectId, "task", "reassigned", ct);

        if (request.NewAssigneeId is not null)
        {
            await _notificationService.NotifyAsync(
                request.NewAssigneeId.Value,
                "Bir görev size atandı",
                $"\"{task.Title}\" adlı görev size atandı.",
                NotificationType.Task,
                $"/tasks/{task.Id}",
                ct);
        }
    }
}