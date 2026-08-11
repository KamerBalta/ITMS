namespace Infera.Application.Common.Interfaces;

public interface IProjectPermissionService
{
    System.Threading.Tasks.Task<bool> IsOverrideEnabledAsync(Guid projectId, string permissionKey, CancellationToken ct = default);
}