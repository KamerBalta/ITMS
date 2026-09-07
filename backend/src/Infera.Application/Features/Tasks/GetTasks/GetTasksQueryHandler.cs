using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
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

        // #11: Kanban board'da Sprint kavrami zorunlu degil -- BoardId=Kanban board ise,
        // tum "Done" olmayan gorevler (SprintId'den BAGIMSIZ) gosterilir. Scrum board'da
        // ise mevcut SprintId filtresi aynen kullanilir.
        Board? board = request.BoardId is not null
            ? await _db.Boards.FirstOrDefaultAsync(b => b.Id == request.BoardId, ct)
            : null;

        var query = board?.BoardType == "Kanban"
            ? _db.Tasks.Where(t => t.ProjectId == request.ProjectId && t.WorkflowStatus.Category != "Done")
            : _db.Tasks.Where(t => t.ProjectId == request.ProjectId);

        if (request.BacklogOnly == true)
            query = query.Where(t => t.SprintId == null);
        else if (request.SprintId is not null)
            query = query.Where(t => t.SprintId == request.SprintId);

        if (request.UnassignedOnly == true)
            query = query.Where(t => t.AssigneeId == null);
        else if (request.AssigneeId is not null)
            query = query.Where(t => t.AssigneeId == request.AssigneeId);

        if (!string.IsNullOrWhiteSpace(request.Status))
            query = query.Where(t => t.WorkflowStatus.Name == request.Status);

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

        if (request.ComponentId is not null)
            query = query.Where(t => _db.TaskComponents.Any(tc => tc.TaskId == t.Id && tc.ProjectComponentId == request.ComponentId));

        return await query
            .AsSplitQuery()
            .OrderBy(t => t.Rank)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(t => new TaskDto(
                t.Id,
                t.Title,
                t.IssueType != null ? t.IssueType.Name : "-",
                t.IssueType != null ? t.IssueType.Icon : null,
                t.Project.Key + "-" + t.TaskNumber,
                t.IssueTypeId,
                t.IssueType != null && t.IssueType.AllowsChildren,
                t.IssueType != null && t.IssueType.RequiresParent,
                t.Priority.ToString(),
                t.WorkflowStatus.Name,
                t.WorkflowStatus.Id,
                t.StoryPoint,
                t.AssigneeId,
                t.Assignee != null ? t.Assignee.Name : null,
                t.SprintId,
                t.Rank,
                t.ParentTaskId,
                t.TaskLabels.Select(tl => tl.Label.Name).ToList()))
            .ToListAsync(ct);
    }
}