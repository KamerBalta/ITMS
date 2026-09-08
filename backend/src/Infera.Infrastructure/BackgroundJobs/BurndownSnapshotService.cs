using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using Infera.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infera.Infrastructure.BackgroundJobs;

public class BurndownSnapshotService : IBurndownSnapshotJob
{
    private readonly IAppDbContext _db;

    public BurndownSnapshotService(IAppDbContext db)
    {
        _db = db;
    }

    public async System.Threading.Tasks.Task RunAsync(CancellationToken ct)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var activeSprints = await _db.Sprints
            .Where(s => s.Status == SprintStatus.Active)
            .ToListAsync(ct);

        foreach (var sprint in activeSprints)
        {
            var alreadyExists = await _db.SprintBurndownSnapshots
                .AnyAsync(
                    sn => sn.SprintId == sprint.Id &&
                          sn.SnapshotDate == today,
                    ct);

            if (alreadyExists)
                continue;

            var tasks = await _db.Tasks
                .Where(t => t.SprintId == sprint.Id)
                .Select(t => new
                {
                    t.StoryPoint,
                    StatusCategory = t.WorkflowStatus.Category
                })
                .ToListAsync(ct);

            var currentScope = tasks.Sum(t => t.StoryPoint ?? 0);

            var completed = tasks
                .Where(t => t.StatusCategory == "Done")
                .Sum(t => t.StoryPoint ?? 0);

            var remaining = tasks
                .Where(t => t.StatusCategory != "Done")
                .Sum(t => t.StoryPoint ?? 0);

            _db.SprintBurndownSnapshots.Add(
                new SprintBurndownSnapshot
                {
                    SprintId = sprint.Id,
                    SnapshotDate = today,
                    ScopeStoryPoints = currentScope,
                    CompletedStoryPoints = completed,
                    RemainingStoryPoints = remaining,
                });
        }

        await _db.SaveChangesAsync(ct);
    }
}