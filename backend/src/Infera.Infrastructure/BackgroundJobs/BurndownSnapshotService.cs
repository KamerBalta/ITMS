using Infera.Domain.Entities;
using Infera.Domain.Enums;
using Infera.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Task = System.Threading.Tasks.Task;

namespace Infera.Infrastructure.BackgroundJobs;

// #4: Her aktif sprint icin gunde bir kez "kalan story point" anlik goruntusu alir --
// Burndown grafiginin gercek (actual) cizgisini olusturan veri kaynagi budur.
public class BurndownSnapshotService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<BurndownSnapshotService> _logger;
    private static readonly TimeSpan CheckInterval = TimeSpan.FromHours(6); // gunde birden fazla kontrol, tekilligi index garanti eder

    public BurndownSnapshotService(IServiceScopeFactory scopeFactory, ILogger<BurndownSnapshotService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await TakeSnapshotsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "BurndownSnapshotService çalışırken hata oluştu.");
            }

            await Task.Delay(CheckInterval, stoppingToken);
        }
    }

    private async Task TakeSnapshotsAsync(CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var activeSprints = await db.Sprints.Where(s => s.Status == SprintStatus.Active).ToListAsync(ct);

        foreach (var sprint in activeSprints)
        {
            var alreadyExists = await db.SprintBurndownSnapshots
                .AnyAsync(sn => sn.SprintId == sprint.Id && sn.SnapshotDate == today, ct);
            if (alreadyExists) continue;

            var remaining = await db.Tasks
                .Where(t => t.SprintId == sprint.Id && t.Status != ItemStatus.Done)
                .SumAsync(t => t.StoryPoint ?? 0, ct);

            db.SprintBurndownSnapshots.Add(new SprintBurndownSnapshot
            {
                SprintId = sprint.Id,
                SnapshotDate = today,
                RemainingStoryPoints = remaining,
            });
        }

        await db.SaveChangesAsync(ct);
    }
}