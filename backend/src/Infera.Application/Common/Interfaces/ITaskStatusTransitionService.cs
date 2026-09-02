namespace Infera.Application.Common.Interfaces;

public interface ITaskStatusTransitionService
{
    System.Threading.Tasks.Task<(bool Allowed, string? ErrorMessage)> CanTransitionAsync(
        Guid projectId, Guid fromStatusId, Guid toStatusId, IReadOnlyList<string> roles, bool isAdmin, bool isAssignee,
        CancellationToken ct = default);
}