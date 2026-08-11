using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Roadmap;

public record GetRoadmapQuery(Guid ProjectId) : IRequest<List<RoadmapEpicDto>>;

public record RoadmapEpicDto(
    Guid Id,
    string Title,
    string Status,
    string? Color,
    DateTime? EarliestSprintStart,
    DateTime? LatestSprintEnd,
    int TotalTasks,
    int DoneTasks);

public class GetRoadmapQueryHandler
    : IRequestHandler<GetRoadmapQuery, List<RoadmapEpicDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetRoadmapQueryHandler(
        IAppDbContext db,
        IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<List<RoadmapEpicDto>> Handle(
        GetRoadmapQuery request,
        CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException(
                "Bu projeye erişim yetkiniz yok.");

        // AllowsChildren=true olan Issue Type'lara sahip
        // üst seviye görevleri Epic olarak kabul ediyoruz.
        var epics = await _db.Tasks
            .Where(t =>
                t.ProjectId == request.ProjectId &&
                t.IssueType != null &&
                t.IssueType.AllowsChildren)
            .Select(t => new
            {
                t.Id,
                t.Title,
                Status = t.Status.ToString(),
                Color = t.IssueType!.Color
            })
            .ToListAsync(ct);

        var result = new List<RoadmapEpicDto>();

        foreach (var epic in epics)
        {
            var children = await _db.Tasks
                .Where(c =>
                    c.ParentTaskId == epic.Id &&
                    c.ProjectId == request.ProjectId)
                .Select(c => new
                {
                    c.Status,
                    c.Sprint
                })
                .ToListAsync(ct);

            var sprintDates = children
                .Where(c => c.Sprint != null)
                .Select(c => c.Sprint!)
                .ToList();

            result.Add(new RoadmapEpicDto(
                epic.Id,
                epic.Title,
                epic.Status,
                epic.Color,
                sprintDates.Count > 0
                    ? sprintDates.Min(s => s.StartDate)
                    : null,
                sprintDates.Count > 0
                    ? sprintDates.Max(s => s.EndDate)
                    : null,
                children.Count,
                children.Count(c => c.Status == ItemStatus.Done)
            ));
        }

        return result
            .OrderBy(e => e.EarliestSprintStart ?? DateTime.MaxValue)
            .ToList();
    }
}