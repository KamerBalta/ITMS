using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Releases.GetReleaseTasks;

public class GetReleaseTasksQueryHandler : IRequestHandler<GetReleaseTasksQuery, List<ReleaseTaskDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetReleaseTasksQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<List<ReleaseTaskDto>> Handle(GetReleaseTasksQuery request, CancellationToken ct)
    {
        var release = await _db.Releases.FirstOrDefaultAsync(r => r.Id == request.ReleaseId, ct)
            ?? throw new KeyNotFoundException("Release bulunamadı.");

        if (!await _access.HasProjectAccessAsync(release.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu release'e erişim yetkiniz yok.");

        return await _db.Tasks
            .Where(t => t.ReleaseId == request.ReleaseId)
          .Select(t => new ReleaseTaskDto(
    t.Id,
    t.Title,
    t.WorkflowStatus.Name,
    t.StatusId))
            .ToListAsync(ct);
    }
}