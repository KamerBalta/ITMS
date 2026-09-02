namespace Infera.Application.Common.Interfaces;

public interface IBacklogGroomingReminderJob
{
    System.Threading.Tasks.Task RunAsync(CancellationToken ct);
}