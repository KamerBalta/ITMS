using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Backlog.ReorderBacklog;

public class ReorderBacklogCommandHandler
    : IRequestHandler<ReorderBacklogCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public ReorderBacklogCommandHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task Handle(
        ReorderBacklogCommand request,
        CancellationToken ct)
    {
        var ids = request.Items
            .Select(i => i.TaskId)
            .ToList();

        var tasks = await _db.Tasks
            .Where(t =>
                ids.Contains(t.Id) &&
                t.SprintId == null)
            .ToListAsync(ct);

        // Tum tasklarin ayni ve erisilebilir bir projeye ait oldugunu dogrula
        var distinctProjectIds = tasks.Select(t => t.ProjectId).Distinct().ToList();
        foreach (var projectId in distinctProjectIds)
        {
            if (!await _access.HasProjectAccessAsync(projectId, ct))
                throw new UnauthorizedAccessException("Bu projedeki görevleri yeniden sıralama yetkiniz yok.");
        }

        foreach (var item in request.Items)
        {
            var task = tasks.FirstOrDefault(x => x.Id == item.TaskId);

            if (task != null)
                task.Rank = item.Rank;
        }

        await _db.SaveChangesAsync(ct);
    }
}