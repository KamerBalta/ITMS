using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Backlog.GetBacklog;

public class GetBacklogQueryHandler
    : IRequestHandler<GetBacklogQuery, List<BacklogTaskDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetBacklogQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<List<BacklogTaskDto>> Handle(
        GetBacklogQuery request,
        CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        var query = _db.Tasks
            .Where(t =>
                t.ProjectId == request.ProjectId &&
                t.SprintId == null);

        if (request.IssueType.HasValue)
            query = query.Where(t => t.IssueType == request.IssueType.Value);

        if (request.Priority.HasValue)
            query = query.Where(t => t.Priority == request.Priority.Value);

        if (request.AssigneeId.HasValue)
            query = query.Where(t => t.AssigneeId == request.AssigneeId.Value);

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            query = query.Where(t =>
                EF.Functions.ILike(t.Title, $"%{request.Search}%"));
        }

        return await query
            .OrderBy(t => t.Rank)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(t => new BacklogTaskDto(
                t.Id,
                t.Title,
                t.IssueType.ToString(),
                t.Priority.ToString(),
                t.StoryPoint,
                t.AssigneeId,
                t.Assignee != null ? t.Assignee.Name : null,
                t.Rank))
            .ToListAsync(ct);
    }
}