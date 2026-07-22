using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Comments.AddComment;

public class AddCommentCommandHandler : IRequestHandler<AddCommentCommand, Guid>
{
    private readonly IAppDbContext _db;
    public AddCommentCommandHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<Guid> Handle(AddCommentCommand request, CancellationToken ct)
    {
        var taskExists = await _db.Tasks.AnyAsync(t => t.Id == request.TaskId, ct);
        if (!taskExists)
            throw new KeyNotFoundException("Görev bulunamadı.");

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

        return comment.Id;
    }
}