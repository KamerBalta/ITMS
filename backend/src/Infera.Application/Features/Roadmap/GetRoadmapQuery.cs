using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Roadmap;

public record GetRoadmapQuery(Guid ProjectId) : IRequest<List<RoadmapEpicDto>>;

public record RoadmapEpicDto(
    Guid Id, string Title, string Status, string? Color,
    DateTime? EarliestSprintStart, DateTime? LatestSprintEnd,
    int TotalTasks, int DoneTasks);

public class GetRoadmapQueryHandler : IRequestHandler<GetRoadmapQuery, List<RoadmapEpicDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;
    public GetRoadmapQueryHandler(IAppDbContext db, IProjectAccessService access) { _db = db; _access = access; }

    public async System.Threading.Tasks.Task<List<RoadmapEpicDto>> Handle(GetRoadmapQuery request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        // Tek sorguda: her Epic icin alt gorevlerin sprint tarih araligi + sayaclari.
        // Onceki versiyondaki foreach + ayri sorgu (N+1) yerine tek LINQ ifadesi.
        var result = await _db.Tasks
            .AsSplitQuery()
            .Where(t => t.ProjectId == request.ProjectId && t.IssueType != null && t.IssueType.AllowsChildren)
            .Select(epic => new RoadmapEpicDto(
                epic.Id,
                epic.Title,
                epic.Status.ToString(),
                epic.IssueType!.Color,
                _db.Tasks.Where(c => c.ParentTaskId == epic.Id && c.Sprint != null).Select(c => (DateTime?)c.Sprint!.StartDate).Min(),
                _db.Tasks.Where(c => c.ParentTaskId == epic.Id && c.Sprint != null).Select(c => (DateTime?)c.Sprint!.EndDate).Max(),
                _db.Tasks.Count(c => c.ParentTaskId == epic.Id),
                _db.Tasks.Count(c => c.ParentTaskId == epic.Id && c.Status == ItemStatus.Done)))
            .ToListAsync(ct);

        return result.OrderBy(e => e.EarliestSprintStart ?? DateTime.MaxValue).ToList();
    }
}