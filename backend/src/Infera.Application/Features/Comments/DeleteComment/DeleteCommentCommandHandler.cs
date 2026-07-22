using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Comments.DeleteComment;

public class DeleteCommentCommandHandler : IRequestHandler<DeleteCommentCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public DeleteCommentCommandHandler(IAppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async System.Threading.Tasks.Task Handle(DeleteCommentCommand request, CancellationToken ct)
    {
        var comment = await _db.Comments.FirstOrDefaultAsync(c => c.Id == request.CommentId, ct)
            ?? throw new KeyNotFoundException("Yorum bulunamadı.");

        // Kendi yorumunu duzenleme kurali (5.2) -- silme icin de ayni mantik + Admin istisnasi
        if (comment.UserId != _currentUser.UserId && !_currentUser.IsAdmin)
            throw new UnauthorizedAccessException("Yalnızca kendi yorumunuzu silebilirsiniz.");

        _db.Comments.Remove(comment);
        await _db.SaveChangesAsync(ct);
    }
}