namespace Infera.Application.Common.Interfaces;

public interface IStaleTaskReminderJob
{
    System.Threading.Tasks.Task RunAsync(CancellationToken ct);
}