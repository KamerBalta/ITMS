namespace Infera.Application.Common.Interfaces;

public interface IAutomationEngine
{
    System.Threading.Tasks.Task ProcessTaskCreatedAsync(Guid taskId, CancellationToken ct = default);
    System.Threading.Tasks.Task ProcessStatusChangedAsync(Guid taskId, string newStatus, CancellationToken ct = default);
}