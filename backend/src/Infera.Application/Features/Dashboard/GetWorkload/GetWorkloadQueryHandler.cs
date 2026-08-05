using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Dashboard.GetWorkload;

public class GetWorkloadQueryHandler : IRequestHandler<GetWorkloadQuery, List<WorkloadDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetWorkloadQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<List<WorkloadDto>> Handle(GetWorkloadQuery request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        return await _db.Tasks
            .Where(t => t.ProjectId == request.ProjectId && t.AssigneeId != null && t.Status != ItemStatus.Done)
            .GroupBy(t => new { t.AssigneeId, t.Assignee!.Name })
            .Select(g => new WorkloadDto(
                g.Key.AssigneeId!.Value, g.Key.Name,
                g.Count(), g.Sum(t => t.StoryPoint ?? 0), 0))
            .ToListAsync(ct);
    }
}