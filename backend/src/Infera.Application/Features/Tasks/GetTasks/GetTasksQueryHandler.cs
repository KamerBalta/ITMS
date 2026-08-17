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

        if (request.IssueTypeId is not null)
            query = query.Where(t => t.IssueTypeId == request.IssueTypeId);

        if (request.Priority is not null)
            query = query.Where(t => t.Priority == request.Priority);

        if (!string.IsNullOrWhiteSpace(request.Search))
            query = query.Where(t => EF.Functions.ILike(t.Title, $"%{request.Search}%"));

        if (request.ParentTaskId is not null)
            query = query.Where(t => t.ParentTaskId == request.ParentTaskId);

        // #4: etikete gore filtreleme
        if (request.LabelId is not null)
            query = query.Where(t => t.TaskLabels.Any(tl => tl.LabelId == request.LabelId));

        return await query
            .AsSplitQuery()
            .OrderBy(t => t.Rank)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(t => new TaskDto(
                t.Id, t.Title,
                t.IssueType != null ? t.IssueType.Name : "-",
                t.IssueType != null ? t.IssueType.Icon : null,
                t.Project.Key + "-" + t.TaskNumber,
                t.IssueTypeId,
                t.IssueType != null && t.IssueType.AllowsChildren,
                t.IssueType != null && t.IssueType.RequiresParent,
                t.Priority.ToString(), t.Status.ToString(), t.StoryPoint,
                t.AssigneeId, t.Assignee != null ? t.Assignee.Name : null,
                t.SprintId, t.Rank, t.ParentTaskId,
                t.TaskLabels.Select(tl => tl.Label.Name).ToList()))
            .ToListAsync(ct);
    }
}