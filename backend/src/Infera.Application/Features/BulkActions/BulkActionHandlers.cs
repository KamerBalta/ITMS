using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Tasks.BulkActions;

public class BulkMoveToSprintCommandHandler : IRequestHandler<BulkMoveToSprintCommand, BulkActionResultDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IRealtimeNotifier _realtime;
    private readonly ICacheService _cache;

    public BulkMoveToSprintCommandHandler(IAppDbContext db, ICurrentUserService currentUser, IRealtimeNotifier realtime, ICacheService cache)
    {
        _db = db; _currentUser = currentUser; _realtime = realtime; _cache = cache;
    }

    public async System.Threading.Tasks.Task<BulkActionResultDto> Handle(BulkMoveToSprintCommand request, CancellationToken ct)
    {
        var tasks = await _db.Tasks.Where(t => request.TaskIds.Contains(t.Id)).ToListAsync(ct);
        var isPrivileged = _currentUser.IsAdmin || _currentUser.Roles.Contains("Project Manager");

        if (!isPrivileged)
            return new BulkActionResultDto(0, tasks.Count, new List<string> { "Toplu sprint taşıma yalnızca Project Manager/Admin tarafından yapılabilir." });

        int successCount = 0;
        var errors = new List<string>();
        var affectedProjectIds = new HashSet<Guid>();

        if (request.SprintId is not null)
        {
            var sprint = await _db.Sprints.FirstOrDefaultAsync(s => s.Id == request.SprintId, ct);
            if (sprint is null) return new BulkActionResultDto(0, tasks.Count, new List<string> { "Sprint bulunamadı." });

            foreach (var task in tasks)
            {
                if (task.ProjectId != sprint.ProjectId)
                {
                    errors.Add($"{task.Title}: farklı bir projeye ait, bu sprinte taşınamaz.");
                    continue;
                }
                task.SprintId = request.SprintId;
                successCount++;
                affectedProjectIds.Add(task.ProjectId);
            }
        }
        else
        {
            // SprintId=null -> Backlog'a geri tasi
            foreach (var task in tasks)
            {
                task.SprintId = null;
                successCount++;
                affectedProjectIds.Add(task.ProjectId);
            }
        }

        await _db.SaveChangesAsync(ct);

        foreach (var projectId in affectedProjectIds)
        {
            await _realtime.NotifyProjectAsync(projectId, "task", "sprint-moved", ct);
            await _cache.RemoveByPrefixAsync($"dashboard:{projectId}:", ct);
        }

        return new BulkActionResultDto(successCount, tasks.Count - successCount, errors);
    }
}

public class BulkAddLabelCommandHandler : IRequestHandler<BulkAddLabelCommand, BulkActionResultDto>
{
    private readonly IAppDbContext _db;
    public BulkAddLabelCommandHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<BulkActionResultDto> Handle(BulkAddLabelCommand request, CancellationToken ct)
    {
        var labelExists = await _db.Labels.AnyAsync(l => l.Id == request.LabelId, ct);
        if (!labelExists) return new BulkActionResultDto(0, request.TaskIds.Count, new List<string> { "Etiket bulunamadı." });

        var existingLinks = await _db.TaskLabels
            .Where(tl => request.TaskIds.Contains(tl.TaskId) && tl.LabelId == request.LabelId)
            .Select(tl => tl.TaskId)
            .ToListAsync(ct);

        var toAdd = request.TaskIds.Except(existingLinks).ToList();
        foreach (var taskId in toAdd)
            _db.TaskLabels.Add(new TaskLabel { TaskId = taskId, LabelId = request.LabelId });

        await _db.SaveChangesAsync(ct);

        return new BulkActionResultDto(toAdd.Count, request.TaskIds.Count - toAdd.Count,
            existingLinks.Count > 0 ? new List<string> { $"{existingLinks.Count} göreve etiket zaten eklenmişti." } : new List<string>());
    }
}

public class BulkDeleteCommandHandler : IRequestHandler<BulkDeleteCommand, BulkActionResultDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IRealtimeNotifier _realtime;

    public BulkDeleteCommandHandler(IAppDbContext db, ICurrentUserService currentUser, IRealtimeNotifier realtime)
    {
        _db = db; _currentUser = currentUser; _realtime = realtime;
    }

    public async System.Threading.Tasks.Task<BulkActionResultDto> Handle(BulkDeleteCommand request, CancellationToken ct)
    {
        // #6: toplu silme yalnizca PM/Admin -- geri donusu olan soft-delete oldugu icin
        // (ISoftDelete zaten Task'a uygulanmisti) veri kaybi riski dusuk ama yine de
        // yuksek yetki seviyesi gerektiriyoruz.
        var isPrivileged = _currentUser.IsAdmin || _currentUser.Roles.Contains("Project Manager");
        if (!isPrivileged)
            return new BulkActionResultDto(0, request.TaskIds.Count, new List<string> { "Toplu silme yalnızca Project Manager/Admin tarafından yapılabilir." });

        var tasks = await _db.Tasks.Where(t => request.TaskIds.Contains(t.Id)).ToListAsync(ct);
        var affectedProjectIds = tasks.Select(t => t.ProjectId).Distinct().ToList();

        _db.Tasks.RemoveRange(tasks); // ISoftDelete sayesinde SaveChangesAsync override'i bunu otomatik soft-delete'e cevirir

        await _db.SaveChangesAsync(ct);

        foreach (var projectId in affectedProjectIds)
            await _realtime.NotifyProjectAsync(projectId, "task", "bulk-deleted", ct);

        return new BulkActionResultDto(tasks.Count, request.TaskIds.Count - tasks.Count, new List<string>());
    }
}