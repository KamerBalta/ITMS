using System.Text.Json;
using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Common.Services;

public class AutomationEngine : IAutomationEngine
{
    private readonly IAppDbContext _db;
    private readonly INotificationService _notificationService;

    public AutomationEngine(IAppDbContext db, INotificationService notificationService)
    {
        _db = db;
        _notificationService = notificationService;
    }

    public async System.Threading.Tasks.Task ProcessTaskCreatedAsync(Guid taskId, CancellationToken ct = default)
    {
        var task = await _db.Tasks.Include(t => t.IssueType).FirstOrDefaultAsync(t => t.Id == taskId, ct);
        if (task is null) return;

        var rules = await _db.AutomationRules
            .Where(r => r.ProjectId == task.ProjectId && r.IsActive && r.TriggerType == "TaskCreated")
            .ToListAsync(ct);

        foreach (var rule in rules)
        {
            var context = new Dictionary<string, string?> { ["issueTypeName"] = task.IssueType?.Name };
            if (!MatchesAllConditions(rule.TriggerConditionJson, context)) continue;
            await ExecuteActionAsync(rule, task, ct);
        }
    }

    public async System.Threading.Tasks.Task ProcessStatusChangedAsync(Guid taskId, string newStatus, CancellationToken ct = default)
    {
        var task = await _db.Tasks.Include(t => t.IssueType).FirstOrDefaultAsync(t => t.Id == taskId, ct);
        if (task is null) return;

        var rules = await _db.AutomationRules
            .Where(r => r.ProjectId == task.ProjectId && r.IsActive && r.TriggerType == "StatusChangedTo")
            .ToListAsync(ct);

        foreach (var rule in rules)
        {
            var context = new Dictionary<string, string?> { ["status"] = newStatus, ["issueTypeName"] = task.IssueType?.Name };
            if (!MatchesAllConditions(rule.TriggerConditionJson, context)) continue;
            await ExecuteActionAsync(rule, task, ct);
        }
    }

    // #Yuksek-8: yeni tetikleyici -- gorev birine atanınca
    public async System.Threading.Tasks.Task ProcessTaskAssignedAsync(Guid taskId, Guid? newAssigneeId, CancellationToken ct = default)
    {
        if (newAssigneeId is null) return;

        var task = await _db.Tasks.Include(t => t.IssueType).FirstOrDefaultAsync(t => t.Id == taskId, ct);
        if (task is null) return;

        var rules = await _db.AutomationRules
            .Where(r => r.ProjectId == task.ProjectId && r.IsActive && r.TriggerType == "TaskAssigned")
            .ToListAsync(ct);

        foreach (var rule in rules)
        {
            var context = new Dictionary<string, string?> { ["issueTypeName"] = task.IssueType?.Name };
            if (!MatchesAllConditions(rule.TriggerConditionJson, context)) continue;
            await ExecuteActionAsync(rule, task, ct);
        }
    }

    // #Yuksek-8: yeni tetikleyici -- goreve yorum eklenince
    public async System.Threading.Tasks.Task ProcessCommentAddedAsync(Guid taskId, CancellationToken ct = default)
    {
        var task = await _db.Tasks.Include(t => t.IssueType).FirstOrDefaultAsync(t => t.Id == taskId, ct);
        if (task is null) return;

        var rules = await _db.AutomationRules
            .Where(r => r.ProjectId == task.ProjectId && r.IsActive && r.TriggerType == "CommentAdded")
            .ToListAsync(ct);

        foreach (var rule in rules)
        {
            var context = new Dictionary<string, string?> { ["issueTypeName"] = task.IssueType?.Name };
            if (!MatchesAllConditions(rule.TriggerConditionJson, context)) continue;
            await ExecuteActionAsync(rule, task, ct);
        }
    }

    // #Yuksek-8: artik tek key degil, kosul JSON'undaki TUM key'ler eslesmeli (AND mantigi).
    // Onceki versiyon yalnizca bilinen tek bir anahtari kontrol ediyordu; simdi kosul objesindeki
    // her key context'teki karsiligiyla birebir eslesmezse kural atlanir.
    private static bool MatchesAllConditions(string? conditionJson, Dictionary<string, string?> context)
    {
        if (string.IsNullOrEmpty(conditionJson)) return true;

        try
        {
            using var doc = JsonDocument.Parse(conditionJson);
            foreach (var property in doc.RootElement.EnumerateObject())
            {
                var expected = property.Value.GetString();
                if (!context.TryGetValue(property.Name, out var actual)) continue; // bilinmeyen key -- yoksay
                if (!string.Equals(expected, actual, StringComparison.OrdinalIgnoreCase)) return false;
            }
            return true;
        }
        catch
        {
            return true;
        }
    }

    private async System.Threading.Tasks.Task ExecuteActionAsync(Domain.Entities.AutomationRule rule, Domain.Entities.Task task, CancellationToken ct)
    {
        try
        {
            using var doc = JsonDocument.Parse(rule.ActionParamsJson);
            var root = doc.RootElement;

            switch (rule.ActionType)
            {
                case "AssignToUser":
                    if (root.TryGetProperty("userId", out var userIdProp) && Guid.TryParse(userIdProp.GetString(), out var userId))
                    {
                        task.AssigneeId = userId;
                        await _db.SaveChangesAsync(ct);
                    }
                    break;

                case "NotifyUser":
                    if (root.TryGetProperty("userId", out var notifyUserIdProp) && Guid.TryParse(notifyUserIdProp.GetString(), out var notifyUserId))
                    {
                        await _notificationService.NotifyAsync(
                            notifyUserId, $"Otomasyon: {rule.Name}",
                            $"\"{task.Title}\" görevi için '{rule.Name}' kuralı tetiklendi.",
                            NotificationType.Task, $"/tasks/{task.Id}", ct);
                    }
                    break;

                case "SetPriority":
                    if (root.TryGetProperty("priority", out var priorityProp) && Enum.TryParse<Priority>(priorityProp.GetString(), out var priority))
                    {
                        task.Priority = priority;
                        await _db.SaveChangesAsync(ct);
                    }
                    break;

                case "AddLabel":
                    if (root.TryGetProperty("labelId", out var labelIdProp) && Guid.TryParse(labelIdProp.GetString(), out var labelId))
                    {
                        var alreadyLinked = await _db.TaskLabels.AnyAsync(tl => tl.TaskId == task.Id && tl.LabelId == labelId, ct);
                        if (!alreadyLinked)
                        {
                            _db.TaskLabels.Add(new Domain.Entities.TaskLabel { TaskId = task.Id, LabelId = labelId });
                            await _db.SaveChangesAsync(ct);
                        }
                    }
                    break;
            }
        }
        catch
        {
            // Bir kuralin calisirken hata almasi diger islemleri engellemesin
        }
    }
}