using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Releases.GetReleases;

public class GetReleasesQueryHandler : IRequestHandler<GetReleasesQuery, List<ReleaseDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetReleasesQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<List<ReleaseDto>> Handle(GetReleasesQuery request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        return await _db.Releases
            .Where(r => r.ProjectId == request.ProjectId)
            .OrderByDescending(r => r.ReleaseDate)
            .Select(r => new ReleaseDto(r.Id, r.Version, r.ReleaseDate, r.Description))
            .ToListAsync(ct);
    }
}