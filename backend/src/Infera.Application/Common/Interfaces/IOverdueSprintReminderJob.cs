namespace Infera.Application.Common.Interfaces;

public interface IOverdueSprintReminderJob
{
    System.Threading.Tasks.Task RunAsync(CancellationToken ct);
}