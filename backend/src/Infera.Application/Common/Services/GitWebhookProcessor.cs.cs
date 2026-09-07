using System.Text.Json;
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

    public GitWebhookProcessor(IAppDbContext db, INotificationService notificationService, IRealtimeNotifier realtime, IAutomationEngine automationEngine)
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

                // #2: Komutu, projenin GERCEK workflow gecislerine karsi dogruluyoruz --
                // sabit "#close" varsayimi tamamen kaldirildi.
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

    // #2: "#close" gibi eski alias'lari da destekleyerek, komut adini projenin gercek
    // durumlarindan biriyle eslestirmeye calisir. Eslesme bulunursa VE mevcut durumdan
    // hedef duruma gecerli bir WorkflowTransition varsa uygular; yoksa SESSIZCE YOK SAYAR
    // (commit push'unu asla basarisiz kilmaz) ama bir Git activity notu duser ki kullanici
    // neden gecmedigini anlayabilsin.
    private async System.Threading.Tasks.Task TryApplyStatusCommandAsync(
        Domain.Entities.Task task, string command, ProjectGitIntegration integration, CancellationToken ct)
    {
        var allStatuses = await _db.ProjectWorkflowStatuses
            .Where(s => s.ProjectId == task.ProjectId && !s.IsDraft)
            .ToListAsync(ct);

        // "close"/"resolve" -> entegrasyon kurulurken PM'in sectigi CloseTargetStatus'a alias'lanir.
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

        if (targetStatus.Id == task.StatusId) return; // zaten o durumda, islem yapmaya gerek yok

        var transitionExists = await _db.WorkflowTransitions.AnyAsync(
            t => t.ProjectId == task.ProjectId && t.FromStatusId == task.StatusId && t.ToStatusId == targetStatus.Id && !t.IsDraft, ct);

        if (!transitionExists)
        {
            var currentStatusName = task.WorkflowStatus.Name;
            _db.Comments.Add(new Comment
            {
                TaskId = task.Id,
                UserId = task.ReporterId,
                Content = $"⚠️ Git commit `#{command}` komutu çalıştırılamadı: \"{currentStatusName}\" durumundan \"{targetStatus.Name}\" durumuna workflow'da tanımlı bir geçiş yok.",
            });
            return;
        }

        // #Kritik-1 (onceki tur): commit'i tetikleyen kisi bir sistem kullanicisi degil --
        // Git commit'lerinde rol/yetki kontrolu yapmiyoruz (repo'ya push yetkisi zaten
        // organizasyonel bir guven sinirini temsil ediyor), bu yuzden gecis kurallarindaki
        // "AllowedRoles" kontrolunu BURADA atliyoruz -- yalnizca GECISIN VAR OLUP OLMADIGINI kontrol ediyoruz.
        task.StatusId = targetStatus.Id;
        task.UpdatedAt = DateTime.UtcNow;

        await _automationEngine.ProcessStatusChangedAsync(task.Id, targetStatus.Name, ct);
    }

    public async System.Threading.Tasks.Task ProcessGitHubBranchCreatedAsync(Guid projectId, string payloadJson, CancellationToken ct = default)
    {
        using var doc = JsonDocument.Parse(payloadJson);
        // GitHub "create" event'i: { "ref": "branch-adi", "ref_type": "branch" }
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

    // #3: Branch/PR adindan Issue Key'i cikarip gorevi buluyoruz -- "ITMS-15-yeni-ozellik"
    // gibi bir branch adinda, herhangi bir yerde gecen Issue Key deseni yakalanir.
    private async System.Threading.Tasks.Task<Domain.Entities.Task?> FindTaskFromBranchNameAsync(Guid projectId, string branchOrPrName, CancellationToken ct)
    {
        var match = System.Text.RegularExpressions.Regex.Match(branchOrPrName, @"([A-Z][A-Z0-9]+-\d+)", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        if (!match.Success) return null;

        var parts = match.Groups[1].Value.ToUpperInvariant().Split('-');
        if (parts.Length != 2 || !int.TryParse(parts[1], out var taskNumber)) return null;

        return await _db.Tasks.FirstOrDefaultAsync(t => t.ProjectId == projectId && t.Project.Key == parts[0] && t.TaskNumber == taskNumber, ct);
    }
}