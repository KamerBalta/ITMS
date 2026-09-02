using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Tasks.BulkUpdateStatus;

public class BulkUpdateStatusCommandHandler : IRequestHandler<BulkUpdateStatusCommand, BulkActionResultDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly ITaskStatusTransitionService _transitionService;
    private readonly IRealtimeNotifier _realtime;
    private readonly ICacheService _cache;

    public BulkUpdateStatusCommandHandler(
        IAppDbContext db, ICurrentUserService currentUser, ITaskStatusTransitionService transitionService,
        IRealtimeNotifier realtime, ICacheService cache)
    {
        _db = db;
        _currentUser = currentUser;
        _transitionService = transitionService;
        _realtime = realtime;
        _cache = cache;
    }

    public async System.Threading.Tasks.Task<BulkActionResultDto> Handle(BulkUpdateStatusCommand request, CancellationToken ct)
    {
        var tasks = await _db.Tasks.Include(t => t.WorkflowStatus).Where(t => request.TaskIds.Contains(t.Id)).ToListAsync(ct);
        var newStatus = await _db.ProjectWorkflowStatuses.FirstOrDefaultAsync(s => s.Id == request.NewStatusId, ct)
            ?? throw new KeyNotFoundException("Hedef durum bulunamadı.");

        int successCount = 0;
        var errors = new List<string>();
        var affectedProjectIds = new HashSet<Guid>();

        var isPrivileged = _currentUser.IsAdmin || _currentUser.Roles.Contains("Project Manager");

        foreach (var task in tasks)
        {
            if (newStatus.ProjectId != task.ProjectId)
            {
                errors.Add($"{task.Title}: bu durum bu projeye ait değil.");
                continue;
            }

            var isAssignee = isPrivileged || task.AssigneeId == _currentUser.UserId;
            var (allowed, errorMessage) = await _transitionService.CanTransitionAsync(
                task.ProjectId, task.StatusId, request.NewStatusId, _currentUser.Roles, _currentUser.IsAdmin, isAssignee, ct);

            if (!allowed)
            {
                errors.Add($"{task.Title}: {errorMessage}");
                continue;
            }

            task.StatusId = request.NewStatusId;
            task.UpdatedAt = DateTime.UtcNow;
            successCount++;
            affectedProjectIds.Add(task.ProjectId);
        }

        await _db.SaveChangesAsync(ct);

        foreach (var projectId in affectedProjectIds)
        {
            await _realtime.NotifyProjectAsync(projectId, "task", "status-changed", ct);
            await _cache.RemoveByPrefixAsync($"dashboard:{projectId}:", ct);
        }

        return new BulkActionResultDto(successCount, tasks.Count - successCount, errors);
    }
}