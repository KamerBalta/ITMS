using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Dashboard.GetDashboard;

public class GetDashboardQueryHandler : IRequestHandler<GetDashboardQuery, DashboardDto>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetDashboardQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<DashboardDto> Handle(GetDashboardQuery request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        var tasks = await _db.Tasks
            .Where(t => t.ProjectId == request.ProjectId)
            .Select(t => new { t.Status, t.DueDate })
            .ToListAsync(ct);

        var activeSprint = await _db.Sprints
            .Where(s => s.ProjectId == request.ProjectId && s.Status == SprintStatus.Active)
            .Select(s => new { s.Name, s.EndDate, TaskCount = s.Tasks.Count })
            .FirstOrDefaultAsync(ct);

        var now = DateTime.UtcNow;

        return new DashboardDto(
            TotalTasks: tasks.Count,
            ToDoCount: tasks.Count(t => t.Status == ItemStatus.ToDo),
            InProgressCount: tasks.Count(t => t.Status == ItemStatus.InProgress),
            ReadyForReviewCount: tasks.Count(t => t.Status == ItemStatus.ReadyForReview),
            ReadyForQACount: tasks.Count(t => t.Status == ItemStatus.ReadyForQA),
            DoneCount: tasks.Count(t => t.Status == ItemStatus.Done),
            OverdueCount: tasks.Count(t => t.DueDate != null && t.DueDate < now && t.Status != ItemStatus.Done),
            ActiveSprintName: activeSprint?.Name,
            ActiveSprintEndDate: activeSprint?.EndDate,
            ActiveSprintTaskCount: activeSprint?.TaskCount ?? 0);
    }
}