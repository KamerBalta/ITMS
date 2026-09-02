using System;

namespace Infera.Application.Common.Interfaces;

public interface IRealtimeNotifier
{
    System.Threading.Tasks.Task NotifyProjectAsync(Guid projectId, string entityType, string action, CancellationToken ct = default);
}