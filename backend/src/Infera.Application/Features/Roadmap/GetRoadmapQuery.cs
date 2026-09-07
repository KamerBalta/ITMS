using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Roadmap;

public record GetRoadmapQuery(Guid ProjectId) : IRequest<RoadmapDto>;

public record RoadmapDto(List<RoadmapEpicDto> Epics, List<RoadmapDependencyDto> Dependencies);

public record RoadmapEpicDto(
    Guid Id,
    string IssueKey,
    string Title,
    string Status,
    Guid StatusId,
    string? Color,
    DateOnly? EarliestSprintStart,
    DateOnly? LatestSprintEnd,
    int TotalTasks,
    int DoneTasks);

// #1: Epic'ler arası "Blocks" ilişkisi -- bir Epic'in alt görevlerinden biri, başka bir
// Epic'in alt görevini "Blocks" ediyorsa, bu iki Epic arasında bir bağımlılık oku çizilir.
public record RoadmapDependencyDto(Guid FromEpicId, Guid ToEpicId, string LinkType);

public class GetRoadmapQueryHandler : IRequestHandler<GetRoadmapQuery, RoadmapDto>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetRoadmapQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<RoadmapDto> Handle(GetRoadmapQuery request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        var epics = await _db.Tasks
            .AsSplitQuery()
            .Where(t =>
                t.ProjectId == request.ProjectId &&
                t.IssueType != null &&
                t.IssueType.AllowsChildren)
            .Select(epic => new RoadmapEpicDto(
                epic.Id,
                epic.Project.Key + "-" + epic.TaskNumber,
                epic.Title,
                epic.WorkflowStatus.Name,
                epic.StatusId,
                epic.IssueType!.Color,

                _db.Tasks
                    .Where(c => c.ParentTaskId == epic.Id && c.Sprint != null)
                    .Select(c => (DateOnly?)c.Sprint!.StartDate)
                    .Min(),

                _db.Tasks
                    .Where(c => c.ParentTaskId == epic.Id && c.Sprint != null)
                    .Select(c => (DateOnly?)c.Sprint!.EndDate)
                    .Max(),

                _db.Tasks.Count(c => c.ParentTaskId == epic.Id),

                _db.Tasks.Count(c => c.ParentTaskId == epic.Id && c.WorkflowStatus.Category == "Done")))
            .ToListAsync(ct);

        var epicIds = epics.Select(e => e.Id).ToHashSet();

        // #1: Task seviyesindeki TÜM TaskLink'leri çek, sonra her linki "hangi Epic'e ait"
        // olduğuna göre epic-to-epic seviyesine yükselt (roll-up). Aynı Epic çiftinin
        // arasında birden fazla link varsa tekilleştir (Distinct).
        var allLinks = await _db.TaskLinks
            .Where(l => l.SourceTask.ProjectId == request.ProjectId || l.TargetTask.ProjectId == request.ProjectId)
            .Select(l => new
            {
                l.SourceTaskId,
                l.TargetTaskId,
                l.LinkType,
                SourceParentId = l.SourceTask.ParentTaskId,
                TargetParentId = l.TargetTask.ParentTaskId
            })
            .ToListAsync(ct);

        var dependencies = allLinks
            .Select(l => new
            {
                FromEpic = epicIds.Contains(l.SourceTaskId) ? l.SourceTaskId : l.SourceParentId,
                ToEpic = epicIds.Contains(l.TargetTaskId) ? l.TargetTaskId : l.TargetParentId,
                l.LinkType,
            })
            .Where(x => x.FromEpic is not null && x.ToEpic is not null && x.FromEpic != x.ToEpic
                        && epicIds.Contains(x.FromEpic.Value) && epicIds.Contains(x.ToEpic.Value)
                        && x.LinkType == "Blocks") // Sadece "Blocks" ilişkisi roadmap üzerinde anlamlıdır
            .Select(x => new RoadmapDependencyDto(x.FromEpic!.Value, x.ToEpic!.Value, x.LinkType))
            .Distinct()
            .ToList();

        var sortedEpics = epics
            .OrderBy(e => e.EarliestSprintStart ?? DateOnly.MaxValue)
            .ToList();

        return new RoadmapDto(sortedEpics, dependencies);
    }
}