using Infera.Application.Common.Interfaces;
using Infera.Application.Common.Services;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Comments.UpdateComment;

public class UpdateCommentCommandHandler : IRequestHandler<UpdateCommentCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IProjectAccessService _access;
    private readonly INotificationService _notificationService;

    public UpdateCommentCommandHandler(
        IAppDbContext db,
        ICurrentUserService currentUser,
        IProjectAccessService access,
        INotificationService notificationService)
    {
        _db = db;
        _currentUser = currentUser;
        _access = access;
        _notificationService = notificationService;
    }

    public async System.Threading.Tasks.Task Handle(UpdateCommentCommand request, CancellationToken ct)
    {
        var comment = await _db.Comments.FirstOrDefaultAsync(c => c.Id == request.CommentId, ct)
            ?? throw new KeyNotFoundException("Yorum bulunamadı.");

        if (!await _access.HasTaskAccessAsync(comment.TaskId, ct))
            throw new UnauthorizedAccessException("Bu göreve erişim yetkiniz yok.");

        var isOwnerOrPrivileged = comment.UserId == _currentUser.UserId
            || _currentUser.IsAdmin
            || _currentUser.Roles.Contains("Project Manager");

        if (!isOwnerOrPrivileged)
            throw new UnauthorizedAccessException("Yalnızca kendi yorumunuzu düzenleyebilirsiniz.");

        if (string.IsNullOrWhiteSpace(request.Content))
            throw new InvalidOperationException("Yorum içeriği boş olamaz.");

        // Mevcut mention'lari (guncelleme oncesi) al -- ayni kisiye tekrar bildirim gitmesin
        var previousMentions = MentionParser.ExtractMentionedUserIds(comment.Content);

        comment.Content = request.Content;
        await _db.SaveChangesAsync(ct);

        // #5 fix: guncellemede de mention bildirimi -- yalnizca YENI eklenen mention'lar icin gonder
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == comment.TaskId, ct);
        var newMentions = MentionParser.ExtractMentionedUserIds(request.Content)
            .Where(id => id != _currentUser.UserId && !previousMentions.Contains(id));

        foreach (var userId in newMentions)
        {
            await _notificationService.NotifyAsync(
                userId,
                "Bir yorumda bahsedildiniz",
                $"\"{task?.Title}\" görevindeki bir yorumda sizden bahsedildi.",
                NotificationType.Mention,
                $"/tasks/{comment.TaskId}?commentId={comment.Id}#comments",
                ct: ct);
        }
    }
}