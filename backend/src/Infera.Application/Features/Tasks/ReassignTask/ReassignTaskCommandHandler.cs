using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Infera.Domain.Enums;
namespace Infera.Application.Features.Tasks.ReassignTask;

public class ReassignTaskCommandHandler : IRequestHandler<ReassignTaskCommand>
{
    private readonly IAppDbContext _db;
    private readonly INotificationService _notificationService;

    public ReassignTaskCommandHandler(IAppDbContext db, INotificationService notificationService)
    {
        _db = db;
        _notificationService = notificationService;
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