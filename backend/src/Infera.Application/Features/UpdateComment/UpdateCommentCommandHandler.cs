using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Comments.UpdateComment;

public class UpdateCommentCommandHandler : IRequestHandler<UpdateCommentCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IProjectAccessService _access;

    public UpdateCommentCommandHandler(IAppDbContext db, ICurrentUserService currentUser, IProjectAccessService access)
    {
        _db = db;
        _currentUser = currentUser;
        _access = access;
    }

    public async System.Threading.Tasks.Task Handle(UpdateCommentCommand request, CancellationToken ct)
    {
        var comment = await _db.Comments.FirstOrDefaultAsync(c => c.Id == request.CommentId, ct)
            ?? throw new KeyNotFoundException("Yorum bulunamadı.");

        if (!await _access.HasTaskAccessAsync(comment.TaskId, ct))
            throw new UnauthorizedAccessException("Bu göreve erişim yetkiniz yok.");

        if (comment.UserId != _currentUser.UserId)
            throw new UnauthorizedAccessException("Yalnızca kendi yorumunuzu düzenleyebilirsiniz.");

        if (string.IsNullOrWhiteSpace(request.Content))
            throw new InvalidOperationException("Yorum içeriği boş olamaz.");

        comment.Content = request.Content;
        await _db.SaveChangesAsync(ct);
    }
}