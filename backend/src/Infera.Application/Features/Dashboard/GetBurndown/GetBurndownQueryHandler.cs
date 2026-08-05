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

    public async System.Threading.Tasks.Task<BurndownDto> Handle(GetBurndownQuery request, CancellationToken ct)
    {
        var sprint = await _db.Sprints.FirstOrDefaultAsync(s => s.Id == request.SprintId, ct)
            ?? throw new KeyNotFoundException("Sprint bulunamadı.");

        if (!await _access.HasProjectAccessAsync(sprint.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu sprinte erişim yetkiniz yok.");

        var tasks = await _db.Tasks
            .Where(t => t.SprintId == request.SprintId)
            .Select(t => new { t.StoryPoint, t.Status })
            .ToListAsync(ct);

        // #4: "sprint basindaki toplam" -- sprint henuz tamamlanmadiysa mevcut atanmis
        // gorevlerin toplami (dinamik); tamamlandiysa donmus CommittedStoryPoints kullanilir.
        var totalPoints = sprint.CommittedStoryPoints ?? tasks.Sum(t => t.StoryPoint ?? 0);
        var remainingPoints = tasks.Where(t => t.Status != ItemStatus.Done).Sum(t => t.StoryPoint ?? 0);

        var totalDays = Math.Max(1, (sprint.EndDate.Date - sprint.StartDate.Date).Days);
        var idealLine = new List<BurndownPointDto>();
        for (int day = 0; day <= totalDays; day++)
        {
            var remaining = totalPoints - (int)Math.Round((double)totalPoints * day / totalDays);
            idealLine.Add(new BurndownPointDto(sprint.StartDate.Date.AddDays(day), remaining));
        }

        // #4: gercek (actual) cizgi -- gunluk snapshot tablosundan
        var snapshots = await _db.SprintBurndownSnapshots
            .Where(sn => sn.SprintId == request.SprintId)
            .OrderBy(sn => sn.SnapshotDate)
            .Select(sn => new BurndownPointDto(sn.SnapshotDate.ToDateTime(TimeOnly.MinValue), sn.RemainingStoryPoints))
            .ToListAsync(ct);

        return new BurndownDto(sprint.Name, sprint.StartDate, sprint.EndDate, totalPoints, remainingPoints, idealLine, snapshots);
    }
}