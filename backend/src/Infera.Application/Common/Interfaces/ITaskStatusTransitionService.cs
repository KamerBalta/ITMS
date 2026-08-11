using Infera.Domain.Enums;

namespace Infera.Application.Common.Interfaces;

public interface ITaskStatusTransitionService
{
    // async oldu -- artik DB'den okuyor. isAssignee: bu gorevin atandigi kisi mi cagiran.
    System.Threading.Tasks.Task<(bool Allowed, string? ErrorMessage)> CanTransitionAsync(
        Guid projectId, ItemStatus from, ItemStatus to, IReadOnlyList<string> roles, bool isAdmin, bool isAssignee,
        CancellationToken ct = default);
}