using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Dashboard.GetDashboard;

public class GetDashboardQueryHandler : IRequestHandler<GetDashboardQuery, DashboardDto>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;
    private readonly ICurrentUserService _currentUser;
    private readonly ICacheService _cache;

    public GetDashboardQueryHandler(IAppDbContext db, IProjectAccessService access, ICurrentUserService currentUser, ICacheService cache)
    {
        _db = db;
        _access = access;
        _currentUser = currentUser;
        _cache = cache;
    }

    public async System.Threading.Tasks.Task<DashboardDto> Handle(GetDashboardQuery request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        var cacheKey = $"dashboard:{request.ProjectId}:{_currentUser.UserId}";
        var cached = await _cache.GetAsync<DashboardDto>(cacheKey, ct);
        if (cached is not null) return cached;

        var tasks = await _db.Tasks
            .Where(t =>
                t.ProjectId == request.ProjectId &&
                t.AssigneeId == _currentUser.UserId)
            .Select(t => new
            {
                StatusName = t.WorkflowStatus.Name,
                StatusCategory = t.WorkflowStatus.Category,
                t.DueDate
            })
            .ToListAsync(ct);

        var activeSprint = await _db.Sprints
            .Where(s => s.ProjectId == request.ProjectId && s.Status == SprintStatus.Active)
            .Select(s => new { s.Name, s.EndDate, TaskCount = s.Tasks.Count })
            .FirstOrDefaultAsync(ct);

        var now = DateOnly.FromDateTime(DateTime.UtcNow);

        var result = new DashboardDto(
            TotalTasks: tasks.Count,
            ToDoCount: tasks.Count(t =>
                t.StatusName == "To Do"),
            InProgressCount: tasks.Count(t =>
                t.StatusName == "In Progress"),
            ReadyForReviewCount: tasks.Count(t =>
                t.StatusName == "Ready for Review"),
            ReadyForQACount: tasks.Count(t =>
                t.StatusName == "Ready for QA"),
            DoneCount: tasks.Count(t =>
                t.StatusName == "Done" ||
                t.StatusName == "Closed"),
            // #A: Dashboard'daki OverdueCount, Geciken Görevler sayfasındaki (overdueOnly=true)
            // mantığıyla birebir aynı olmalıdır: "Done kategorisinde olmayan ve teslim tarihi geçmiş".
            OverdueCount: tasks.Count(t =>
                t.DueDate != null &&
                t.DueDate < now &&
                t.StatusCategory != "Done"),
            ActiveSprintName: activeSprint?.Name,
            ActiveSprintEndDate: activeSprint?.EndDate,
            ActiveSprintTaskCount: activeSprint?.TaskCount ?? 0);

        await _cache.SetAsync(cacheKey, result, TimeSpan.FromSeconds(60), ct);

        return result;
    }
}