using Infera.Application.Common.Interfaces;
using Infera.Application.Common.Services;
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
    private readonly IRealtimeNotifier _realtime;
    private readonly IAutomationEngine _automationEngine;

    public CreateTaskCommandHandler(
        IAppDbContext db,
        INotificationService notificationService,
        IProjectAccessService access,
        ICurrentUserService currentUser,
        IRealtimeNotifier realtime,
        IAutomationEngine automationEngine)
    {
        _db = db;
        _notificationService = notificationService;
        _access = access;
        _currentUser = currentUser;
        _realtime = realtime;
        _automationEngine = automationEngine;
    }

    public async System.Threading.Tasks.Task<Guid> Handle(CreateTaskCommand request, CancellationToken ct)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.Id == request.ProjectId, ct)
            ?? throw new KeyNotFoundException("Proje bulunamadı.");

        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projede görev oluşturma yetkiniz yok.");

        // #Spec: Kullanici, projeye tanimlanmamis bir Issue Type ile gorev olusturamaz.
        var assignment = await _db.ProjectIssueTypeAssignments
            .Include(a => a.IssueType)
            .FirstOrDefaultAsync(a => a.ProjectId == request.ProjectId && a.IssueTypeId == request.IssueTypeId, ct)
            ?? throw new KeyNotFoundException("Belirtilen issue type bu projeye tanımlanmamış.");

        var issueType = assignment.IssueType;

        if (!issueType.IsActive)
            throw new InvalidOperationException($"'{issueType.Name}' tipi pasif durumda, yeni görev oluşturmak için kullanılamaz.");

        // #13: Issue Type bazli yetkilendirme -- artik veri uzerinden (CreatorTier), sabit enum degil.
        var canCreate = issueType.CreatorTier switch
        {
            0 => true,
            1 => _currentUser.IsAdmin || _currentUser.Roles.Contains("Project Manager") || _currentUser.Roles.Contains("Developer"),
            2 => _currentUser.IsAdmin || _currentUser.Roles.Contains("Project Manager"),
            _ => false
        };
        if (!canCreate)
            throw new UnauthorizedAccessException($"'{issueType.Name}' tipinde görev oluşturma yetkiniz yok.");

        if (issueType.RequiresParent && request.ParentTaskId is null)
            throw new InvalidOperationException($"'{issueType.Name}' tipi mutlaka bir üst göreve bağlanmalıdır.");

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
                throw new InvalidOperationException("Belirtilen üst görev bulunamadı.");
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

        // #Breadcrumb: proje bazli atomik artan Issue Key numarasi (orn. ITMS-125)
        var taskNumber = project.NextTaskNumber;
        project.NextTaskNumber++;

        var maxRank = await _db.Tasks
            .Where(t => t.ProjectId == request.ProjectId)
            .Select(t => (long?)t.Rank)
            .MaxAsync(ct) ?? 0;

        var task = new Domain.Entities.Task
        {
            ProjectId = request.ProjectId,
            SprintId = request.SprintId,
            ParentTaskId = request.ParentTaskId,
            IssueTypeId = issueType.Id,
            Title = request.Title,
            Description = request.Description,
            Priority = request.Priority,
            StoryPoint = request.StoryPoint,
            Status = ItemStatus.ToDo,
            AssigneeId = request.AssigneeId,
            ReporterId = request.ReporterId,
            DueDate = request.DueDate,
            Rank = maxRank + 1000,
            TaskNumber = taskNumber,
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
                $"/tasks/{task.Id}",
                ct);
        }
        foreach (var userId in MentionParser.ExtractMentionedUserIds(request.Description).Where(id => id != request.ReporterId))
        {
            await _notificationService.NotifyAsync(
                userId, "Görev açıklamasında bahsedildiniz",
                $"\"{task.Title}\" görevinin açıklamasında sizden bahsedildi.",
                NotificationType.Mention, $"/tasks/{task.Id}", ct);
        }

        await _realtime.NotifyProjectAsync(task.ProjectId, "task", "created", ct);
        await _automationEngine.ProcessTaskCreatedAsync(task.Id, ct);

        return task.Id;
    }
}