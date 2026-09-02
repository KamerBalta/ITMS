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
    private readonly ICacheService _cache;

    public CreateTaskCommandHandler(
        IAppDbContext db,
        INotificationService notificationService,
        IProjectAccessService access,
        ICurrentUserService currentUser,
        IRealtimeNotifier realtime,
        IAutomationEngine automationEngine,
        ICacheService cache)
    {
        _db = db;
        _notificationService = notificationService;
        _access = access;
        _currentUser = currentUser;
        _realtime = realtime;
        _automationEngine = automationEngine;
        _cache = cache;
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

        // #2: Teslim tarihi, mevcut duzenleme kuralinin (yalnizca PM/Admin) olusturma anindaki aynasi.
        if (request.DueDate is not null && !(_currentUser.IsAdmin || _currentUser.Roles.Contains("Project Manager")))
            throw new UnauthorizedAccessException("Teslim tarihi belirleme yetkiniz yok. Yalnızca Project Manager/Admin belirleyebilir.");

        // #Kritik-2: proje icin tanimli TUM zorunlu custom field'lar doldurulmus olmali,
        // yoksa gorev olusturma engellenir.
        var requiredFields = await _db.CustomFieldDefinitions
            .Where(f => f.ProjectId == request.ProjectId && f.IsRequired)
            .ToListAsync(ct);

        var providedValues = request.CustomFieldValues ?? new Dictionary<Guid, string?>();

        foreach (var field in requiredFields)
        {
            if (!providedValues.TryGetValue(field.Id, out var value) || string.IsNullOrWhiteSpace(value))
                throw new InvalidOperationException($"'{field.Name}' alanı zorunludur.");
        }

        if (request.AssigneeId is not null)
        {
            var assigneeIsMember = await _db.ProjectMembers
                .AnyAsync(m => m.ProjectId == request.ProjectId && m.UserId == request.AssigneeId, ct);
            if (!assigneeIsMember)
                throw new InvalidOperationException("Atanan kullanıcı bu projenin üyesi değil.");
        }

        if (request.ParentTaskId is not null)
        {
            var parent = await _db.Tasks
                .Include(t => t.IssueType)
                .FirstOrDefaultAsync(t => t.Id == request.ParentTaskId, ct);

            if (parent is null)
                throw new InvalidOperationException("Belirtilen üst görev bulunamadı.");

            if (parent.ProjectId != request.ProjectId)
                throw new InvalidOperationException("Üst görev farklı bir projeye ait olamaz.");

            if (parent.IssueType is null)
                throw new InvalidOperationException("Üst görevin issue type bilgisi bulunamadı.");

            // Parent child kabul etmiyorsa altında görev oluşturulamaz.
            if (!parent.IssueType.AllowsChildren)
                throw new InvalidOperationException(
                    $"'{parent.IssueType.Name}' tipi alt görev kabul etmiyor.");

            // Sub-task başka bir Sub-task'ın altında olamaz.
            if (issueType.RequiresParent && parent.IssueType.RequiresParent)
                throw new InvalidOperationException(
                    "Bir Sub-task, başka bir Sub-task'ın altına eklenemez.");
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

        // #Breadcrumb: Proje bazli atomik artan Issue Key numarasi
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
            StatusId = (await _db.ProjectWorkflowStatuses.FirstAsync(s => s.ProjectId == request.ProjectId && s.IsInitial, ct)).Id,
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
                ct: ct);
        }

        foreach (var userId in MentionParser.ExtractMentionedUserIds(request.Description).Where(id => id != request.ReporterId))
        {
            await _notificationService.NotifyAsync(
                userId,
                "Görev açıklamasında bahsedildiniz",
                $"\"{task.Title}\" görevinin açıklamasında sizden bahsedildi.",
                NotificationType.Mention,
                $"/tasks/{task.Id}",
                ct: ct);
        }

        await _realtime.NotifyProjectAsync(task.ProjectId, "task", "created", ct);
        await _cache.RemoveByPrefixAsync($"dashboard:{task.ProjectId}:", ct);

        if (request.ComponentIds is { Count: > 0 })
        {
            var validComponentIds = await _db.ProjectComponents
                .Where(c => c.ProjectId == request.ProjectId && request.ComponentIds.Contains(c.Id))
                .Select(c => c.Id)
                .ToListAsync(ct);

            foreach (var componentId in validComponentIds)
                _db.TaskComponents.Add(new Domain.Entities.TaskComponent { TaskId = task.Id, ProjectComponentId = componentId });

            if (validComponentIds.Count > 0)
                await _db.SaveChangesAsync(ct);
        }

        if (request.LabelIds is { Count: > 0 })
        {
            var validLabelIds = await _db.Labels
                .Where(l => request.LabelIds.Contains(l.Id))
                .Select(l => l.Id)
                .ToListAsync(ct);

            foreach (var labelId in validLabelIds)
                _db.TaskLabels.Add(new Domain.Entities.TaskLabel { TaskId = task.Id, LabelId = labelId });

            if (validLabelIds.Count > 0)
                await _db.SaveChangesAsync(ct);
        }

        if (request.CustomFieldValues is { Count: > 0 })
        {
            var validFieldIds = await _db.CustomFieldDefinitions
                .Where(f => f.ProjectId == request.ProjectId && request.CustomFieldValues.Keys.Contains(f.Id))
                .Select(f => f.Id)
                .ToListAsync(ct);

            foreach (var fieldId in validFieldIds)
            {
                var value = request.CustomFieldValues[fieldId];
                if (!string.IsNullOrEmpty(value))
                {
                    _db.TaskCustomFieldValues.Add(new Domain.Entities.TaskCustomFieldValue
                    {
                        TaskId = task.Id,
                        CustomFieldDefinitionId = fieldId,
                        Value = value,
                    });
                }
            }

            if (validFieldIds.Count > 0)
                await _db.SaveChangesAsync(ct);
        }

        await _automationEngine.ProcessTaskCreatedAsync(task.Id, ct);

        return task.Id;
    }
}