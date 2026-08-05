using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Releases.GetReleaseById;

public class GetReleaseByIdQueryHandler : IRequestHandler<GetReleaseByIdQuery, ReleaseDetailDto>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetReleaseByIdQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<ReleaseDetailDto> Handle(GetReleaseByIdQuery request, CancellationToken ct)
    {
        var release = await _db.Releases
            .Where(r => r.Id == request.ReleaseId)
            .Select(r => new { r.ProjectId, Dto = new ReleaseDetailDto(r.Id, r.Version, r.ReleaseDate, r.Description, r.Project.Name) })
            .FirstOrDefaultAsync(ct);

        if (release is null)
            throw new KeyNotFoundException("Release bulunamadı.");

        if (!await _access.HasProjectAccessAsync(release.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu release'e erişim yetkiniz yok.");

        return release.Dto;
    }
}