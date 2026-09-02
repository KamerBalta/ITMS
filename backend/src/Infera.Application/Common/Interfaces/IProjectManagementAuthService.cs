namespace Infera.Application.Common.Interfaces;

public interface IProjectManagementAuthService
{
    // Admin HER ZAMAN true. PM ise: (a) ProjectMembers'ta ProjectRole=ProjectManager olarak
    // atanmissa YA DA (b) Project.OwnerId kendisiyse (eski/legacy uyumluluk) true.
    Task<bool> IsProjectManagerOrAdminAsync(Guid projectId, CancellationToken ct = default);
    Task EnsureProjectManagerOrAdminAsync(Guid projectId, CancellationToken ct = default);
}