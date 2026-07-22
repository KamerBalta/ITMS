using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Tasks.CreateTask;

public class CreateTaskCommandHandler : IRequestHandler<CreateTaskCommand, Guid>
{
    private readonly IAppDbContext _db;
    private readonly INotificationService _notificationService;

    public CreateTaskCommandHandler(IAppDbContext db, INotificationService notificationService)
    {
        _db = db;
        _notificationService = notificationService;
    }

    public async System.Threading.Tasks.Task<Guid> Handle(CreateTaskCommand request, CancellationToken ct)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.Id == request.ProjectId, ct)
            ?? throw new KeyNotFoundException("Proje bulunamadı.");

        if (request.AssigneeId is not null)
        {
            var assigneeIsMember = await _db.ProjectMembers
                .AnyAsync(m => m.ProjectId == request.ProjectId && m.UserId == request.AssigneeId, ct);
            if (!assigneeIsMember)
                throw new InvalidOperationException("Atanan kullanıcı bu projenin üyesi değil.");
        }

        if (request.SprintId is not null)
        {
            var sprintBelongsToProject = await _db.Sprints
                .AnyAsync(s => s.Id == request.SprintId && s.ProjectId == request.ProjectId, ct);
            if (!sprintBelongsToProject)
                throw new InvalidOperationException("Belirtilen Sprint bu projeye ait değil.");
        }

        var maxRank = await _db.Tasks
            .Where(t => t.ProjectId == request.ProjectId)
            .Select(t => (long?)t.Rank)
            .MaxAsync(ct) ?? 0;

        var task = new Domain.Entities.Task
        {
            ProjectId = request.ProjectId,
            SprintId = request.SprintId,
            Title = request.Title,
            Description = request.Description,
            IssueType = request.IssueType,
            Priority = request.Priority,
            StoryPoint = request.StoryPoint,
            Status = ItemStatus.ToDo,
            AssigneeId = request.AssigneeId,
            ReporterId = request.ReporterId,
            DueDate = request.DueDate,
            Rank = maxRank + 1000
        };

        _db.Tasks.Add(task);
        await _db.SaveChangesAsync(ct);

        // Atama bildirimi -- Bolum 11.10 / 10.2
        if (request.AssigneeId is not null && request.AssigneeId != request.ReporterId)
        {
            await _notificationService.NotifyAsync(
                request.AssigneeId.Value,
                "Yeni görev atandı",
                $"\"{task.Title}\" adlı görev size atandı ({project.Name}).",
                NotificationType.Task,
                ct);
        }

        return task.Id;
    }
}