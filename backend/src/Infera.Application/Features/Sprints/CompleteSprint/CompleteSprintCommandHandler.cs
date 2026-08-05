using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Sprints.CompleteSprint;

public class CompleteSprintCommandHandler : IRequestHandler<CompleteSprintCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;
    private readonly INotificationService _notificationService;

    public CompleteSprintCommandHandler(IAppDbContext db, IProjectAccessService access, INotificationService notificationService)
    {
        _db = db;
        _access = access;
        _notificationService = notificationService;
    }

    public async System.Threading.Tasks.Task Handle(CompleteSprintCommand request, CancellationToken ct)
    {
        var sprint = await _db.Sprints.FirstOrDefaultAsync(s => s.Id == request.SprintId, ct)
            ?? throw new KeyNotFoundException("Sprint bulunamadı.");

        if (!await _access.HasProjectAccessAsync(sprint.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu sprinti tamamlama yetkiniz yok.");

        if (sprint.Status == SprintStatus.Completed)
            throw new InvalidOperationException("Sprint zaten tamamlanmış.");

        var incompleteTasks = await _db.Tasks
            .Where(t => t.SprintId == sprint.Id && t.Status != ItemStatus.Done)
            .ToListAsync(ct);

        foreach (var task in incompleteTasks)
        {
            task.SprintId = null;
            task.UpdatedAt = DateTime.UtcNow;
        }

        sprint.Status = SprintStatus.Completed;
        await _db.SaveChangesAsync(ct);

        // BR-014: Sprint bitis bildirimi -- projenin tum uyelerine
        var memberIds = await _db.ProjectMembers
            .Where(m => m.ProjectId == sprint.ProjectId)
            .Select(m => m.UserId)
            .Distinct()
            .ToListAsync(ct);

        foreach (var userId in memberIds)
        {
            await _notificationService.NotifyAsync(
                userId,
                "Sprint tamamlandı",
                $"\"{sprint.Name}\" sprinti tamamlandı." + (incompleteTasks.Count > 0
                    ? $" {incompleteTasks.Count} tamamlanmamış görev Backlog'a geri alındı."
                    : ""),
                NotificationType.Sprint,
                ct);
        }
    }
}