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

    public GitWebhookProcessor(IAppDbContext db, INotificationService notificationService, IRealtimeNotifier realtime)
    {
        _db = db;
        _notificationService = notificationService;
        _realtime = realtime;
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
                ? nameEl.GetString() ?? "Bilinmeyen"
                : "Bilinmeyen";
            var url = commitEl.TryGetProperty("url", out var urlEl) ? urlEl.GetString() : null;
            var timestamp = commitEl.TryGetProperty("timestamp", out var tsEl) && DateTime.TryParse(tsEl.GetString(), out var ts)
                ? ts.ToUniversalTime()
                : DateTime.UtcNow;

            var references = SmartCommitParser.Parse(message);
            if (references.Count == 0) continue;

            foreach (var reference in references)
            {
                // #Git: Issue Key'in son sayisini "-" ile ayirip TaskNumber olarak, prefix'i
                // Project.Key olarak eslestiriyoruz -- boylece proje ID'sini disaridan tahmin
                // etmeye gerek kalmadan, projenin kendi anahtarindan dogru gorevi buluyoruz.
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
                        UserId = task.ReporterId, // #Git: sistem kullanicisi yerine reporter'a atfediyoruz -- gercek bir kullanici hesabi olmadigi icin
                        Content = $"🔗 Git commit ile eklendi ({authorName}): {reference.CommentText}",
                    });
                }

                if (reference.ShouldClose && integration.CloseTargetStatusId is not null && task.StatusId != integration.CloseTargetStatusId)
                {
                    task.StatusId = integration.CloseTargetStatusId.Value;
                    task.UpdatedAt = DateTime.UtcNow;
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
}