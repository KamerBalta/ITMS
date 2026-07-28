using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Releases.CreateRelease;

public class CreateReleaseCommandHandler : IRequestHandler<CreateReleaseCommand, Guid>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public CreateReleaseCommandHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<Guid> Handle(CreateReleaseCommand request, CancellationToken ct)
    {
        var projectExists = await _db.Projects.AnyAsync(p => p.Id == request.ProjectId, ct);
        if (!projectExists)
            throw new KeyNotFoundException("Proje bulunamadı.");

        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projede release oluşturma yetkiniz yok.");

        var versionExists = await _db.Releases
            .AnyAsync(r => r.ProjectId == request.ProjectId && r.Version == request.Version, ct);
        if (versionExists)
            throw new InvalidOperationException("Bu versiyon numarası bu projede zaten kullanılıyor.");

        var release = new Release
        {
            ProjectId = request.ProjectId,
            Version = request.Version,
            ReleaseDate = request.ReleaseDate,
            Description = request.Description
        };

        _db.Releases.Add(release);
        await _db.SaveChangesAsync(ct);

        return release.Id;
    }
}