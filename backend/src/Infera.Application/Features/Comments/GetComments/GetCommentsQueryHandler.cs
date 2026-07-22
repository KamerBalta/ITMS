using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Comments.GetComments;

public class GetCommentsQueryHandler : IRequestHandler<GetCommentsQuery, List<CommentDto>>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public GetCommentsQueryHandler(IAppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async System.Threading.Tasks.Task<List<CommentDto>> Handle(GetCommentsQuery request, CancellationToken ct)
    {
        var currentUserId = _currentUser.UserId; // once yerel degiskene al -- EF Core'a guvenli parametre olarak gecsin

        return await _db.Comments
            .Where(c => c.TaskId == request.TaskId)
            .OrderBy(c => c.CreatedAt)
            .Select(c => new CommentDto(c.Id, c.User.Name, c.Content, c.CreatedAt, c.UserId == currentUserId))
            .ToListAsync(ct);
    }
}