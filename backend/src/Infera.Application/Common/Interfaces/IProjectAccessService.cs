namespace Infera.Application.Common.Interfaces;

public interface IProjectAccessService
{
    Task<List<Guid>> GetAccessibleProjectIdsAsync(CancellationToken ct = default);
    Task<bool> HasProjectAccessAsync(Guid projectId, CancellationToken ct = default);
    Task<bool> HasTaskAccessAsync(Guid taskId, CancellationToken ct = default);
    Task<bool> HasSprintAccessAsync(Guid sprintId, CancellationToken ct = default);
}