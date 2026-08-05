using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Comments.GetComments;

public class GetCommentsQueryHandler : IRequestHandler<GetCommentsQuery, List<CommentDto>>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IProjectAccessService _access;

    public GetCommentsQueryHandler(IAppDbContext db, ICurrentUserService currentUser, IProjectAccessService access)
    {
        _db = db;
        _currentUser = currentUser;
        _access = access;
    }

    public async System.Threading.Tasks.Task<List<CommentDto>> Handle(GetCommentsQuery request, CancellationToken ct)
    {
        if (!await _access.HasTaskAccessAsync(request.TaskId, ct))
            throw new UnauthorizedAccessException("Bu göreve erişim yetkiniz yok.");

        var currentUserId = _currentUser.UserId;

        return await _db.Comments
            .Where(c => c.TaskId == request.TaskId)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new CommentDto(c.Id, c.User.Name, c.Content, c.CreatedAt, c.UserId == currentUserId))
            .ToListAsync(ct);
    }
}