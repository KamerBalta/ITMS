using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Releases.UpdateRelease;

public class UpdateReleaseCommandHandler : IRequestHandler<UpdateReleaseCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public UpdateReleaseCommandHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task Handle(UpdateReleaseCommand request, CancellationToken ct)
    {
        var release = await _db.Releases.FirstOrDefaultAsync(r => r.Id == request.ReleaseId, ct)
            ?? throw new KeyNotFoundException("Release bulunamadı.");

        if (!await _access.HasProjectAccessAsync(release.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu release'i güncelleme yetkiniz yok.");

        release.ReleaseDate = request.ReleaseDate;
        release.Description = request.Description;

        await _db.SaveChangesAsync(ct);
    }
}