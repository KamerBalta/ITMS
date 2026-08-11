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
            if (!MatchesCondition(rule.TriggerConditionJson, "issueTypeName", task.IssueType?.Name)) continue;
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
            if (!MatchesCondition(rule.TriggerConditionJson, "status", newStatus)) continue;
            await ExecuteActionAsync(rule, task, ct);
        }
    }

    private static bool MatchesCondition(string? conditionJson, string key, string? actualValue)
    {
        if (string.IsNullOrEmpty(conditionJson)) return true; // kosul yoksa her zaman eslesir

        try
        {
            using var doc = JsonDocument.Parse(conditionJson);
            if (!doc.RootElement.TryGetProperty(key, out var expected)) return true;
            return string.Equals(expected.GetString(), actualValue, StringComparison.OrdinalIgnoreCase);
        }
        catch
        {
            return true; // bozuk JSON -- otomasyonu engelleme
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
            // Bir kuralin calisirken hata almasi diger islemleri (task olusturma vb.) engellemesin
        }
    }
}