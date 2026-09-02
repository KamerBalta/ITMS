using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Dashboard.GetVelocity;

public class GetVelocityQueryHandler : IRequestHandler<GetVelocityQuery, List<VelocityDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;
    private readonly ICacheService _cache;

    public GetVelocityQueryHandler(IAppDbContext db, IProjectAccessService access, ICacheService cache)
    {
        _db = db;
        _access = access;
        _cache = cache;
    }

    public async System.Threading.Tasks.Task<List<VelocityDto>> Handle(GetVelocityQuery request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        
        var cacheKey = $"velocity:{request.ProjectId}";
        var cacheListKey = $"velocity-list:{request.ProjectId}:";
        var cached = await _cache.GetAsync<List<VelocityDto>>(cacheKey, ct);
        if (cached is not null) return cached;

        var result = await _db.Sprints
            .Where(s => s.ProjectId == request.ProjectId && s.Status == SprintStatus.Completed)
            .OrderBy(s => s.StartDate)
            .Select(s => new VelocityDto(
                s.Id, s.Name,
                s.CommittedStoryPoints ?? s.Tasks.Sum(t => t.StoryPoint ?? 0),
                s.Tasks.Where(t => t.WorkflowStatus.Category == "Done").Sum(t => t.StoryPoint ?? 0)))
            .ToListAsync(ct);

        await _cache.SetAsync(cacheKey, result, TimeSpan.FromMinutes(10), ct);

        return result;
    }
}