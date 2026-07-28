using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Tasks.CreateTask;

public class CreateTaskCommandHandler : IRequestHandler<CreateTaskCommand, Guid>
{
    private readonly IAppDbContext _db;
    private readonly INotificationService _notificationService;
    private readonly IProjectAccessService _access;
    private readonly ICurrentUserService _currentUser;

    public CreateTaskCommandHandler(
        IAppDbContext db,
        INotificationService notificationService,
        IProjectAccessService access,
        ICurrentUserService currentUser)
    {
        _db = db;
        _notificationService = notificationService;
        _access = access;
        _currentUser = currentUser;
    }

    public async System.Threading.Tasks.Task<Guid> Handle(CreateTaskCommand request, CancellationToken ct)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.Id == request.ProjectId, ct)
            ?? throw new KeyNotFoundException("Proje bulunamadı.");

        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projede görev oluşturma yetkiniz yok.");

        // Gorev olusturma: yalnizca PM ve Developer (QA/Tester olusturamaz, yalnizca test surecinde durum degistirir)
        var canCreate = _currentUser.IsAdmin
            || _currentUser.Roles.Contains("Project Manager")
            || _currentUser.Roles.Contains("Developer");
        if (!canCreate)
            throw new UnauthorizedAccessException("Görev oluşturma yetkiniz yok. Yalnızca Project Manager ve Developer görev oluşturabilir.");

        if (request.AssigneeId is not null)
        {
            var assigneeIsMember = await _db.ProjectMembers
                .AnyAsync(m => m.ProjectId == request.ProjectId && m.UserId == request.AssigneeId, ct);
            if (!assigneeIsMember)
                throw new InvalidOperationException("Atanan kullanıcı bu projenin üyesi değil.");
        }

        if (request.ParentTaskId is not null)
        {
            var parent = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == request.ParentTaskId, ct);
            if (parent is null)
                throw new InvalidOperationException("Belirtilen üst görev (Epic) bulunamadı.");
            if (parent.ProjectId != request.ProjectId)
                throw new InvalidOperationException("Üst görev farklı bir projeye ait olamaz.");
        }

        if (request.SprintId is not null)
        {
            var sprint = await _db.Sprints
                .FirstOrDefaultAsync(s => s.Id == request.SprintId && s.ProjectId == request.ProjectId, ct);

            if (sprint is null)
                throw new InvalidOperationException("Belirtilen Sprint bu projeye ait değil.");

            var isPrivileged = _currentUser.IsAdmin || _currentUser.Roles.Contains("Project Manager");
            if (sprint.Status == SprintStatus.Active && !isPrivileged)
                throw new UnauthorizedAccessException("Aktif sprint kapsamına yalnızca Project Manager yeni görev ekleyebilir.");
        }

        var maxRank = await _db.Tasks
            .Where(t => t.ProjectId == request.ProjectId)
            .Select(t => (long?)t.Rank)
            .MaxAsync(ct) ?? 0;

        var task = new Domain.Entities.Task
        {
            ProjectId = request.ProjectId,
            SprintId = request.SprintId,
            ParentTaskId = request.ParentTaskId,
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