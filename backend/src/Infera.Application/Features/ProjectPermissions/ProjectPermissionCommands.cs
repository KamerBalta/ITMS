using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.ProjectPermissions;

public record GetProjectPermissionsQuery(Guid ProjectId) : IRequest<List<ProjectPermissionDto>>;
public record SetProjectPermissionCommand(Guid ProjectId, string PermissionKey, bool IsEnabled) : IRequest;

public record ProjectPermissionDto(string PermissionKey, bool IsEnabled);

public static class KnownPermissionKeys
{
    public static readonly string[] All = { "DeveloperCanManageSprints", "DeveloperCanReassign" };
}

public class GetProjectPermissionsQueryHandler : IRequestHandler<GetProjectPermissionsQuery, List<ProjectPermissionDto>>
{
    private readonly IAppDbContext _db;
    public GetProjectPermissionsQueryHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<List<ProjectPermissionDto>> Handle(GetProjectPermissionsQuery request, CancellationToken ct)
    {
        var existing = await _db.ProjectPermissionOverrides
            .Where(o => o.ProjectId == request.ProjectId)
            .ToDictionaryAsync(o => o.PermissionKey, ct);

        return KnownPermissionKeys.All
            .Select(key => new ProjectPermissionDto(key, existing.TryGetValue(key, out var o) && o.IsEnabled))
            .ToList();
    }
}

public class SetProjectPermissionCommandHandler : IRequestHandler<SetProjectPermissionCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public SetProjectPermissionCommandHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task Handle(SetProjectPermissionCommand request, CancellationToken ct)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.Id == request.ProjectId, ct) ?? throw new KeyNotFoundException("Proje bulunamadı.");
        if (!_currentUser.IsAdmin && project.OwnerId != _currentUser.UserId)
            throw new UnauthorizedAccessException("Bu projede yetki ayarı değiştirme izniniz yok.");

        if (!KnownPermissionKeys.All.Contains(request.PermissionKey))
            throw new InvalidOperationException("Bilinmeyen yetki anahtarı.");

        var entity = await _db.ProjectPermissionOverrides
            .FirstOrDefaultAsync(o => o.ProjectId == request.ProjectId && o.PermissionKey == request.PermissionKey, ct);

        if (entity is null)
            _db.ProjectPermissionOverrides.Add(new ProjectPermissionOverride { ProjectId = request.ProjectId, PermissionKey = request.PermissionKey, IsEnabled = request.IsEnabled });
        else
            entity.IsEnabled = request.IsEnabled;

        await _db.SaveChangesAsync(ct);
    }
}