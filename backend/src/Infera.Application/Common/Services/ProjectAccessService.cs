using Infera.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Common.Services;

public class ProjectAccessService : IProjectAccessService
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public ProjectAccessService(IAppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<List<Guid>> GetAccessibleProjectIdsAsync(CancellationToken ct = default)
    {
        if (_currentUser.IsAdmin)
            return await _db.Projects.Select(p => p.Id).ToListAsync(ct);

        return await _db.ProjectMembers
            .Where(m => m.UserId == _currentUser.UserId)
            .Select(m => m.ProjectId)
            .Distinct()
            .ToListAsync(ct);
    }

    public async Task<bool> HasProjectAccessAsync(Guid projectId, CancellationToken ct = default)
    {
        if (_currentUser.IsAdmin)
            return true;

        return await _db.ProjectMembers
            .AnyAsync(m => m.ProjectId == projectId && m.UserId == _currentUser.UserId, ct);
    }

    public async Task<bool> HasTaskAccessAsync(Guid taskId, CancellationToken ct = default)
    {
        var projectId = await _db.Tasks
            .Where(t => t.Id == taskId)
            .Select(t => (Guid?)t.ProjectId)
            .FirstOrDefaultAsync(ct);

        return projectId is not null && await HasProjectAccessAsync(projectId.Value, ct);
    }

    public async Task<bool> HasSprintAccessAsync(Guid sprintId, CancellationToken ct = default)
    {
        var projectId = await _db.Sprints
            .Where(s => s.Id == sprintId)
            .Select(s => (Guid?)s.ProjectId)
            .FirstOrDefaultAsync(ct);

        return projectId is not null && await HasProjectAccessAsync(projectId.Value, ct);
    }
}