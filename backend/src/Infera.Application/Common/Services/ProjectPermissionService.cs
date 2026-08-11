using Infera.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Common.Services;

public class ProjectPermissionService : IProjectPermissionService
{
    private readonly IAppDbContext _db;
    public ProjectPermissionService(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<bool> IsOverrideEnabledAsync(Guid projectId, string permissionKey, CancellationToken ct = default)
    {
        var overrideEntity = await _db.ProjectPermissionOverrides
            .FirstOrDefaultAsync(o => o.ProjectId == projectId && o.PermissionKey == permissionKey, ct);
        return overrideEntity?.IsEnabled ?? false; // tanimli degilse varsayilan: kapali (sistem varsayilan davranisi korunur)
    }
}