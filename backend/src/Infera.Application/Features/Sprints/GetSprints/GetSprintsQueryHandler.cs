using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Sprints.GetSprints;

public class GetSprintsQueryHandler : IRequestHandler<GetSprintsQuery, List<SprintDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetSprintsQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<List<SprintDto>> Handle(GetSprintsQuery request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        return await _db.Sprints
            .Where(s => s.ProjectId == request.ProjectId)
            .OrderByDescending(s => s.StartDate)
            .Select(s => new SprintDto(
                s.Id, s.Name, s.Goal, s.StartDate, s.EndDate, s.Status.ToString(),
                s.Tasks.Count, s.Tasks.Sum(t => t.StoryPoint ?? 0)))
            .ToListAsync(ct);
    }
}