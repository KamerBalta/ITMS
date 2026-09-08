using System.Text.Json;
using System.Text.RegularExpressions;
using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using Infera.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Common.Services;

public class GitWebhookProcessor : IGitWebhookProcessor
{
    private readonly IAppDbContext _db;
    private readonly INotificationService _notificationService;
    private readonly IRealtimeNotifier _realtime;
    private readonly IAutomationEngine _automationEngine;

    public GitWebhookProcessor(
        IAppDbContext db,
        INotificationService notificationService,
        IRealtimeNotifier realtime,
        IAutomationEngine automationEngine)
    {
        _db = db;
        _notificationService = notificationService;
        _realtime = realtime;
        _automationEngine = automationEngine;
    }

    public async System.Threading.Tasks.Task ProcessGitHubPushAsync(Guid projectId, string payloadJson, CancellationToken ct = default)
    {
        var integration = await _db.ProjectGitIntegrations.FirstOrDefaultAsync(g => g.ProjectId == projectId && g.IsActive, ct);
        if (integration is null) return;

        using var doc = JsonDocument.Parse(payloadJson);
        if (!doc.RootElement.TryGetProperty("commits", out var commitsElement)) return;

        var branchName = doc.RootElement.TryGetProperty("ref", out var refEl)
            ? refEl.GetString()?.Replace("refs/heads/", "")
            : null;

        foreach (var commitEl in commitsElement.EnumerateArray())
        {
            var hash = commitEl.GetProperty("id").GetString() ?? "";
            var message = commitEl.GetProperty("message").GetString() ?? "";
            var authorName = commitEl.TryGetProperty("author", out var authorEl) && authorEl.TryGetProperty("name", out var nameEl)
                ? nameEl.GetString() ?? "Bilinmeyen" : "Bilinmeyen";
            var url = commitEl.TryGetProperty("url", out var urlEl) ? urlEl.GetString() : null;
            var timestamp = commitEl.TryGetProperty("timestamp", out var tsEl) && DateTime.TryParse(tsEl.GetString(), out var ts)
                ? ts.ToUniversalTime() : DateTime.UtcNow;

            // Değişen dosyaları toparla (added, modified, removed)
            var changedFiles = new List<string>();
            if (commitEl.TryGetProperty("added", out var addedEl))
                foreach (var f in addedEl.EnumerateArray()) if (f.GetString() is { } s) changedFiles.Add($"{s} (add)");
            if (commitEl.TryGetProperty("modified", out var modEl))
                foreach (var f in modEl.EnumerateArray()) if (f.GetString() is { } s) changedFiles.Add($"{s} (edit)");
            if (commitEl.TryGetProperty("removed", out var remEl))
                foreach (var f in remEl.EnumerateArray()) if (f.GetString() is { } s) changedFiles.Add($"{s} (delete)");

            var references = SmartCommitParser.Parse(message);
            if (references.Count == 0) continue;

            foreach (var reference in references)
            {
                var parts = reference.IssueKey.Split('-');
                if (parts.Length != 2 || !int.TryParse(parts[1], out var taskNumber)) continue;

                var task = await _db.Tasks
                    .Include(t => t.WorkflowStatus)
                    .FirstOrDefaultAsync(t => t.ProjectId == projectId && t.Project.Key == parts[0] && t.TaskNumber == taskNumber, ct);
                if (task is null) continue;

                var alreadyLinked = await _db.GitCommitLinks.AnyAsync(l => l.TaskId == task.Id && l.CommitHash == hash, ct);
                if (!alreadyLinked)
                {
                    _db.GitCommitLinks.Add(new GitCommitLink
                    {
                        TaskId = task.Id,
                        CommitHash = hash,
                        CommitMessage = message,
                        AuthorName = authorName,
                        CommitUrl = url,
                        BranchName = branchName,
                        SourceType = "Git",
                        ChangedFilesJson = changedFiles.Count > 0 ? JsonSerializer.Serialize(changedFiles) : null,
                        CommittedAt = timestamp,
                    });
                }

                if (!string.IsNullOrEmpty(reference.CommentText))
                {
                    _db.Comments.Add(new Comment
                    {
                        TaskId = task.Id,
                        UserId = task.ReporterId,
                        Content = $"🔗 Git commit ile eklendi ({authorName}): {reference.CommentText}",
                    });
                }

                if (!string.IsNullOrEmpty(reference.StatusCommand))
                {
                    await TryApplyStatusCommandAsync(task, reference.StatusCommand, integration, ct);
                }

                await _db.SaveChangesAsync(ct);

                if (task.AssigneeId is not null)
                {
                    await _notificationService.NotifyAsync(
                        task.AssigneeId.Value, "Git commit ile ilişkilendirildi",
                        $"\"{task.Title}\" görevi için yeni bir commit push edildi: {message.Split('\n')[0]}",
                        NotificationType.Task, $"/tasks/{task.Id}", isImportant: false, ct: ct);
                }

                await _realtime.NotifyProjectAsync(projectId, "task", "git-commit-linked", ct);
            }
        }
    }

    private async System.Threading.Tasks.Task TryApplyStatusCommandAsync(
        Domain.Entities.Task task, string command, ProjectGitIntegration integration, CancellationToken ct)
    {
        var allStatuses = await _db.ProjectWorkflowStatuses
            .Where(s => s.ProjectId == task.ProjectId && !s.IsDraft)
            .ToListAsync(ct);

        ProjectWorkflowStatus? targetStatus;
        if ((command.Equals("close", StringComparison.OrdinalIgnoreCase) || command.Equals("resolve", StringComparison.OrdinalIgnoreCase))
            && integration.CloseTargetStatusId is not null)
        {
            targetStatus = allStatuses.FirstOrDefault(s => s.Id == integration.CloseTargetStatusId);
        }
        else
        {
            targetStatus = allStatuses.FirstOrDefault(s => SmartCommitParser.SlugifyStatusName(s.Name) == command.ToLowerInvariant());
        }

        if (targetStatus is null)
        {
            _db.Comments.Add(new Comment
            {
                TaskId = task.Id,
                UserId = task.ReporterId,
                Content = $"⚠️ Git commit'teki `#{command}` komutu, bu projede tanımlı bir duruma karşılık gelmiyor. Kullanılabilir komutlar için proje ayarlarına bakın.",
            });
            return;
        }

        if (targetStatus.Id == task.StatusId) return;

        var transitionExists = await _db.WorkflowTransitions.AnyAsync(
            t => t.ProjectId == task.ProjectId && t.FromStatusId == task.StatusId && t.ToStatusId == targetStatus.Id && !t.IsDraft, ct);

        if (!transitionExists)
        {
            var currentStatusName = task.WorkflowStatus?.Name ?? "Bilinmeyen Durum";
            _db.Comments.Add(new Comment
            {
                TaskId = task.Id,
                UserId = task.ReporterId,
                Content = $"⚠️ Git commit `#{command}` komutu çalıştırılamadı: \"{currentStatusName}\" durumundan \"{targetStatus.Name}\" durumuna workflow'da tanımlı bir geçiş yok.",
            });
            return;
        }

        task.StatusId = targetStatus.Id;
        task.UpdatedAt = DateTime.UtcNow;

        await _automationEngine.ProcessStatusChangedAsync(task.Id, targetStatus.Name, ct);
    }

    public async System.Threading.Tasks.Task ProcessGitHubBranchCreatedAsync(Guid projectId, string payloadJson, CancellationToken ct = default)
    {
        using var doc = JsonDocument.Parse(payloadJson);
        if (!doc.RootElement.TryGetProperty("ref_type", out var refTypeEl) || refTypeEl.GetString() != "branch") return;

        var branchName = doc.RootElement.TryGetProperty("ref", out var refEl) ? refEl.GetString() : null;
        if (string.IsNullOrEmpty(branchName)) return;

        var task = await FindTaskFromBranchNameAsync(projectId, branchName, ct);
        if (task is null) return;

        await _automationEngine.ProcessBranchCreatedAsync(task.Id, branchName, ct);
        await _realtime.NotifyProjectAsync(projectId, "task", "git-branch-created", ct);
    }

    public async System.Threading.Tasks.Task ProcessGitHubPullRequestAsync(Guid projectId, string payloadJson, CancellationToken ct = default)
    {
        using var doc = JsonDocument.Parse(payloadJson);
        if (!doc.RootElement.TryGetProperty("action", out var actionEl)) return;

        var action = actionEl.GetString();
        var prElement = doc.RootElement.GetProperty("pull_request");
        var branchName = prElement.GetProperty("head").GetProperty("ref").GetString() ?? "";
        var prUrl = prElement.TryGetProperty("html_url", out var urlEl) ? urlEl.GetString() ?? "" : "";
        var merged = prElement.TryGetProperty("merged", out var mergedEl) && mergedEl.GetBoolean();

        var task = await FindTaskFromBranchNameAsync(projectId, branchName, ct);
        if (task is null) return;

        if (action == "opened")
        {
            await _automationEngine.ProcessPullRequestOpenedAsync(task.Id, prUrl, ct);
            await _realtime.NotifyProjectAsync(projectId, "task", "git-pr-opened", ct);
        }
        else if (action == "closed" && merged)
        {
            await _automationEngine.ProcessPullRequestMergedAsync(task.Id, prUrl, ct);
            await _realtime.NotifyProjectAsync(projectId, "task", "git-pr-merged", ct);
        }
    }

    // #TFVC FR-01/FR-02: Azure DevOps "tfvc.checkin" webhook event'i
    public async System.Threading.Tasks.Task ProcessAzureDevOpsCheckinAsync(Guid projectId, string payloadJson, CancellationToken ct = default)
    {
        var integration = await _db.ProjectGitIntegrations.FirstOrDefaultAsync(g => g.ProjectId == projectId && g.IsActive, ct);
        if (integration is null) return;

        using var doc = JsonDocument.Parse(payloadJson);
        if (!doc.RootElement.TryGetProperty("resource", out var resource)) return;

        var changesetId = resource.TryGetProperty("changesetId", out var idEl) ? idEl.GetInt32().ToString() : null;
        var comment = resource.TryGetProperty("comment", out var commentEl) ? commentEl.GetString() ?? "" : "";
        var authorName = resource.TryGetProperty("checkedInBy", out var authorEl) && authorEl.TryGetProperty("displayName", out var nameEl)
            ? nameEl.GetString() ?? "Bilinmeyen" : "Bilinmeyen";

        if (changesetId is null) return;

        // Tarayıcıdan açılabilir web URL'i oluştur (varsa org ve project name kullanılarak)
        string? url = null;
        if (!string.IsNullOrEmpty(integration.AzureDevOpsOrgUrl) && !string.IsNullOrEmpty(integration.AzureDevOpsProjectName))
        {
            url = $"{integration.AzureDevOpsOrgUrl.TrimEnd('/')}/{Uri.EscapeDataString(integration.AzureDevOpsProjectName)}/_versionControl/changeset/{changesetId}";
        }
        else if (resource.TryGetProperty("url", out var urlEl))
        {
            url = urlEl.GetString();
        }

        var changedFiles = new List<string>();
        if (resource.TryGetProperty("changes", out var changesEl))
        {
            foreach (var change in changesEl.EnumerateArray())
            {
                var path = change.TryGetProperty("item", out var itemEl) && itemEl.TryGetProperty("path", out var pathEl) ? pathEl.GetString() : null;
                var changeType = change.TryGetProperty("changeType", out var typeEl) ? typeEl.GetString() : null;
                if (path is not null) changedFiles.Add($"{path} ({changeType ?? "edit"})");
            }
        }

        var references = SmartCommitParser.Parse(comment);
        if (references.Count == 0) return;

        foreach (var reference in references)
        {
            var parts = reference.IssueKey.Split('-');
            if (parts.Length != 2 || !int.TryParse(parts[1], out var taskNumber)) continue;

            var task = await _db.Tasks
                .Include(t => t.WorkflowStatus)
                .FirstOrDefaultAsync(t => t.ProjectId == projectId && t.Project.Key == parts[0] && t.TaskNumber == taskNumber, ct);
            if (task is null) continue;

            var alreadyLinked = await _db.GitCommitLinks.AnyAsync(l => l.TaskId == task.Id && l.CommitHash == changesetId, ct);
            if (!alreadyLinked)
            {
                _db.GitCommitLinks.Add(new GitCommitLink
                {
                    TaskId = task.Id,
                    CommitHash = changesetId,
                    CommitMessage = comment,
                    AuthorName = authorName,
                    CommitUrl = url,
                    SourceType = "TFVC",
                    ChangedFilesJson = changedFiles.Count > 0 ? JsonSerializer.Serialize(changedFiles) : null,
                    CommittedAt = DateTime.UtcNow,
                });
            }

            if (!string.IsNullOrEmpty(reference.CommentText))
            {
                _db.Comments.Add(new Comment
                {
                    TaskId = task.Id,
                    UserId = task.ReporterId,
                    Content = $"🔗 TFVC check-in ile eklendi ({authorName}): {reference.CommentText}"
                });
            }

            if (!string.IsNullOrEmpty(reference.StatusCommand))
            {
                await TryApplyStatusCommandAsync(task, reference.StatusCommand, integration, ct);
            }

            await _db.SaveChangesAsync(ct);
            await _realtime.NotifyProjectAsync(projectId, "task", "git-commit-linked", ct);
        }
    }

    // #TFVC FR-04: Azure Pipelines "build.complete" webhook event'i
    public async System.Threading.Tasks.Task ProcessAzureDevOpsBuildAsync(Guid projectId, string payloadJson, CancellationToken ct = default)
    {
        var integration = await _db.ProjectGitIntegrations.FirstOrDefaultAsync(g => g.ProjectId == projectId && g.IsActive, ct);
        if (integration is null) return;

        using var doc = JsonDocument.Parse(payloadJson);
        if (!doc.RootElement.TryGetProperty("resource", out var resource)) return;

        // sourceVersion TFVC için "C1042" veya "1042" şeklinde gelebilir; baştaki 'C' veya 'c' temizlenir
        var rawSourceVersion = resource.TryGetProperty("sourceVersion", out var svEl) ? svEl.GetString() : null;
        var sourceVersion = rawSourceVersion?.TrimStart('C', 'c');

        var result = resource.TryGetProperty("result", out var resultEl) ? resultEl.GetString() ?? "unknown" : "unknown";
        var pipelineName = resource.TryGetProperty("definition", out var defEl) && defEl.TryGetProperty("name", out var nameEl)
            ? nameEl.GetString() ?? "Pipeline" : "Pipeline";
        var url = resource.TryGetProperty("_links", out var linksEl) && linksEl.TryGetProperty("web", out var webEl) && webEl.TryGetProperty("href", out var hrefEl)
            ? hrefEl.GetString() : null;

        if (string.IsNullOrEmpty(sourceVersion)) return;

        // Hem temizlenmiş haliyle hem de orijinal haliyle eşleşen task'ları bul
        var linkedTasks = await _db.GitCommitLinks
            .Where(l => (l.CommitHash == sourceVersion || l.CommitHash == rawSourceVersion) && l.Task.ProjectId == projectId)
            .Select(l => l.TaskId)
            .Distinct()
            .ToListAsync(ct);

        var normalizedResult = result.ToLowerInvariant() switch
        {
            "succeeded" => "Succeeded",
            "failed" => "Failed",
            "canceled" or "cancelled" => "Cancelled",
            _ => "InProgress",
        };

        foreach (var taskId in linkedTasks)
        {
            _db.PipelineRuns.Add(new PipelineRun
            {
                TaskId = taskId,
                PipelineName = pipelineName,
                Result = normalizedResult,
                PipelineUrl = url,
                RunAt = DateTime.UtcNow,
            });
            await _realtime.NotifyProjectAsync(projectId, "task", "pipeline-run-recorded", ct);
        }

        await _db.SaveChangesAsync(ct);
    }

    // #TFVC FR-04: Azure DevOps release/deployment webhook'u
    public async System.Threading.Tasks.Task ProcessAzureDevOpsReleaseAsync(Guid projectId, string payloadJson, CancellationToken ct = default)
    {
        var integration = await _db.ProjectGitIntegrations.FirstOrDefaultAsync(g => g.ProjectId == projectId && g.IsActive, ct);
        if (integration is null) return;

        using var doc = JsonDocument.Parse(payloadJson);
        if (!doc.RootElement.TryGetProperty("resource", out var resource)) return;

        var environment = resource.TryGetProperty("environment", out var envEl) && envEl.TryGetProperty("name", out var envNameEl)
            ? envNameEl.GetString() : "Unknown";
        var releaseName = resource.TryGetProperty("release", out var relEl) && relEl.TryGetProperty("name", out var relNameEl)
            ? relNameEl.GetString() ?? "Release" : "Release";
        var deploymentStatus = resource.TryGetProperty("deploymentStatus", out var statusEl) ? statusEl.GetString() ?? "unknown" : "unknown";

        var recentTaskIds = await _db.PipelineRuns
            .Where(p => p.Task.ProjectId == projectId && p.RunAt >= DateTime.UtcNow.AddHours(-2))
            .Select(p => p.TaskId)
            .Distinct()
            .ToListAsync(ct);

        var normalizedResult = deploymentStatus.ToLowerInvariant() switch
        {
            "succeeded" => "Succeeded",
            "failed" => "Failed",
            _ => "InProgress",
        };

        foreach (var taskId in recentTaskIds)
        {
            _db.PipelineRuns.Add(new PipelineRun
            {
                TaskId = taskId,
                PipelineName = releaseName,
                Result = normalizedResult,
                Environment = environment,
                DeployedAt = DateTime.UtcNow,
                RunAt = DateTime.UtcNow,
            });
        }

        await _db.SaveChangesAsync(ct);
        await _realtime.NotifyProjectAsync(projectId, "task", "deployment-recorded", ct);
    }

    private async System.Threading.Tasks.Task<Domain.Entities.Task?> FindTaskFromBranchNameAsync(Guid projectId, string branchOrPrName, CancellationToken ct)
    {
        var match = Regex.Match(branchOrPrName, @"([A-Z][A-Z0-9]+-\d+)", RegexOptions.IgnoreCase);
        if (!match.Success) return null;

        var parts = match.Groups[1].Value.ToUpperInvariant().Split('-');
        if (parts.Length != 2 || !int.TryParse(parts[1], out var taskNumber)) return null;

        return await _db.Tasks.FirstOrDefaultAsync(t => t.ProjectId == projectId && t.Project.Key == parts[0] && t.TaskNumber == taskNumber, ct);
    }
}