using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Tasks.GetTasks;

public class GetTasksQueryHandler : IRequestHandler<GetTasksQuery, List<TaskDto>>
{
    private readonly IAppDbContext _db;
    public GetTasksQueryHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<List<TaskDto>> Handle(GetTasksQuery request, CancellationToken ct)
    {
        var query = _db.Tasks.Where(t => t.ProjectId == request.ProjectId);

        if (request.BacklogOnly == true)
            query = query.Where(t => t.SprintId == null);
        else if (request.SprintId is not null)
            query = query.Where(t => t.SprintId == request.SprintId);

        if (request.AssigneeId is not null)
            query = query.Where(t => t.AssigneeId == request.AssigneeId);

        if (!string.IsNullOrWhiteSpace(request.Status))
            query = query.Where(t => t.Status.ToString() == request.Status);

        return await query
            .OrderBy(t => t.Rank)
            .Select(t => new TaskDto(
                t.Id, t.Title, t.IssueType.ToString(), t.Priority.ToString(), t.Status.ToString(),
                t.StoryPoint, t.Assignee != null ? t.Assignee.Name : null, t.SprintId, t.Rank))
            .ToListAsync(ct);
    }
}