using Infera.Application.Common.Interfaces;
using Infera.Application.Common.Services;
using Infera.Domain.Entities;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Comments.AddComment;

public class AddCommentCommandHandler : IRequestHandler<AddCommentCommand, Guid>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;
    private readonly INotificationService _notificationService;
    private readonly IRealtimeNotifier _realtime;
    private readonly IAutomationEngine _automationEngine;

    public AddCommentCommandHandler(
        IAppDbContext db,
        IProjectAccessService access,
        INotificationService notificationService,
        IRealtimeNotifier realtime,
        IAutomationEngine automationEngine)
    {
        _db = db;
        _access = access;
        _notificationService = notificationService;
        _realtime = realtime;
        _automationEngine = automationEngine;
    }

    public async System.Threading.Tasks.Task<Guid> Handle(AddCommentCommand request, CancellationToken ct)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Görev bulunamadı.");

        if (!await _access.HasTaskAccessAsync(request.TaskId, ct))
            throw new UnauthorizedAccessException("Bu göreve yorum yapma yetkiniz yok.");

        if (string.IsNullOrWhiteSpace(request.Content))
            throw new InvalidOperationException("Yorum içeriği boş olamaz.");

        var comment = new Comment
        {
            TaskId = request.TaskId,
            UserId = request.UserId,
            Content = request.Content
        };

        _db.Comments.Add(comment);
        await _db.SaveChangesAsync(ct);

        // BR-014: yorum bildirimi -- Assignee + Watcher'lara, yorumu yazan haric
        var notifyUserIds = new HashSet<Guid>();

        if (task.AssigneeId is not null)
            notifyUserIds.Add(task.AssigneeId.Value);

        var watcherIds = await _db.Watchers
            .Where(w => w.TaskId == request.TaskId)
            .Select(w => w.UserId)
            .ToListAsync(ct);
        foreach (var id in watcherIds)
            notifyUserIds.Add(id);

        notifyUserIds.Remove(request.UserId); // yorumu yazana kendine bildirim gitmesin

        foreach (var userId in notifyUserIds)
        {
            await _notificationService.NotifyAsync(
                userId,
                "Yeni yorum eklendi",
                $"\"{task.Title}\" adlı göreve yeni bir yorum eklendi.",
                NotificationType.Task,
                $"/tasks/{task.Id}",
                ct: ct);
        }

        // BR-014: @Mention bildirimi -- yukaridaki genel bildirimden bagimsiz, ozel mesajla
        var mentionedUserIds = MentionParser.ExtractMentionedUserIds(request.Content)
            .Where(id => id != request.UserId);

        foreach (var userId in mentionedUserIds)
        {
            await _notificationService.NotifyAsync(
                userId,
                "Bir yorumda bahsedildiniz",
                $"\"{task.Title}\" görevindeki bir yorumda sizden bahsedildi.",
                NotificationType.Mention,
                $"/tasks/{task.Id}?commentId={comment.Id}#comments",
                ct: ct);
        }

        await _realtime.NotifyProjectAsync(task.ProjectId, "comment", "created", ct);

        await _automationEngine.ProcessCommentAddedAsync(request.TaskId, ct);

        return comment.Id;
    }
}