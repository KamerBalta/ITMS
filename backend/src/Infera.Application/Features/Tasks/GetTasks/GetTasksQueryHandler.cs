using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Tasks.GetTasks;

public class GetTasksQueryHandler : IRequestHandler<GetTasksQuery, List<TaskDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetTasksQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<List<TaskDto>> Handle(GetTasksQuery request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        var query = _db.Tasks.Where(t => t.ProjectId == request.ProjectId);

        if (request.BacklogOnly == true)
            query = query.Where(t => t.SprintId == null);
        else if (request.SprintId is not null)
            query = query.Where(t => t.SprintId == request.SprintId);

        if (request.AssigneeId is not null)
            query = query.Where(t => t.AssigneeId == request.AssigneeId);

        if (!string.IsNullOrWhiteSpace(request.Status))
            query = query.Where(t => t.Status.ToString() == request.Status);

        if (request.IssueType is not null)
            query = query.Where(t => t.IssueType == request.IssueType);

        if (request.Priority is not null)
            query = query.Where(t => t.Priority == request.Priority);

        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(t => EF.Functions.ILike(t.Title, $"%{request.Search}%"));

        return await query
            .OrderBy(t => t.Rank)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(t => new TaskDto(
                t.Id, t.Title, t.IssueType.ToString(), t.Priority.ToString(), t.Status.ToString(),
                t.StoryPoint, t.Assignee != null ? t.Assignee.Name : null, t.SprintId, t.Rank))
            .ToListAsync(ct);
    }
}