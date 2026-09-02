using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Common.Services;

public class ProjectManagementAuthService : IProjectManagementAuthService
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public ProjectManagementAuthService(IAppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<bool> IsProjectManagerOrAdminAsync(Guid projectId, CancellationToken ct = default)
    {
        if (_currentUser.IsAdmin) return true;

        var project = await _db.Projects.FirstOrDefaultAsync(p => p.Id == projectId, ct);
        if (project is null) return false;
        if (project.OwnerId == _currentUser.UserId) return true;

        return await _db.ProjectMembers.AnyAsync(
            m => m.ProjectId == projectId && m.UserId == _currentUser.UserId && m.ProjectRole == ProjectRole.ProjectManager, ct);
    }

    public async Task EnsureProjectManagerOrAdminAsync(Guid projectId, CancellationToken ct = default)
    {
        if (!await IsProjectManagerOrAdminAsync(projectId, ct))
            throw new UnauthorizedAccessException("Bu işlem için Project Manager ya da System Admin yetkisi gereklidir.");
    }
}