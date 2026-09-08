using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Dashboard.GetBurndown;

public class GetBurndownQueryHandler : IRequestHandler<GetBurndownQuery, BurndownDto>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetBurndownQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<BurndownDto> Handle(
        GetBurndownQuery request,
        CancellationToken ct)
    {
        var sprint = await _db.Sprints
            .FirstOrDefaultAsync(s => s.Id == request.SprintId, ct)
            ?? throw new KeyNotFoundException("Sprint bulunamadı.");

        if (!await _access.HasProjectAccessAsync(sprint.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu sprinte erişim yetkiniz yok.");

        var tasks = await _db.Tasks
            .Where(t => t.SprintId == request.SprintId)
            .Select(t => new
            {
                t.StoryPoint,
                StatusCategory = t.WorkflowStatus.Category
            })
            .ToListAsync(ct);

        // Sprint başındaki toplam:
        // Sprint henüz tamamlanmadıysa mevcut atanmış görevlerin toplamı,
        // tamamlandıysa kaydedilmiş CommittedStoryPoints kullanılır.
        var totalPoints =
            sprint.CommittedStoryPoints
            ?? tasks.Sum(t => t.StoryPoint ?? 0);

        var remainingPoints = tasks
            .Where(t => t.StatusCategory != "Done")
            .Sum(t => t.StoryPoint ?? 0);

        var totalDays = Math.Max(
            1,
            sprint.EndDate.DayNumber - sprint.StartDate.DayNumber);

        var idealLine = new List<BurndownPointDto>();

        for (var day = 0; day <= totalDays; day++)
        {
            var remaining = totalPoints -
                (int)Math.Round(
                    (double)totalPoints * day / totalDays);

            var date = sprint.StartDate
                .AddDays(day)
                .ToDateTime(TimeOnly.MinValue);

            idealLine.Add(
                new BurndownPointDto(date, remaining));
        }

        // Gerçek (actual) çizgi: günlük snapshot tablosundan.
        var snapshots = await _db.SprintBurndownSnapshots
            .Where(sn => sn.SprintId == request.SprintId)
            .OrderBy(sn => sn.SnapshotDate)
            .Select(sn => new BurndownPointDto(
                sn.SnapshotDate.ToDateTime(TimeOnly.MinValue),
                sn.RemainingStoryPoints))
            .ToListAsync(ct);

        var actualLine = new List<BurndownPointDto>();
        var sprintStartDate =
            sprint.StartDate.ToDateTime(TimeOnly.MinValue);
        var startSnapshot = snapshots.FirstOrDefault(
            s => DateOnly.FromDateTime(s.Date) == sprint.StartDate);

        if (startSnapshot is not null)
        {
            actualLine.Add(startSnapshot);
        }
        else
        {
            var startScope =
                sprint.CommittedStoryPoints
                ?? tasks.Sum(t => t.StoryPoint ?? 0);

            actualLine.Add(
                new BurndownPointDto(
                    sprintStartDate,
                    startScope));
        }

        foreach (var snapshot in snapshots)
        {
            if (DateOnly.FromDateTime(snapshot.Date) == sprint.StartDate)
                continue;

            actualLine.Add(snapshot);
        }

        return new BurndownDto(
            sprint.Name,
            sprint.StartDate,
            sprint.EndDate,
            totalPoints,
            remainingPoints,
            idealLine,
            actualLine);
    }
}