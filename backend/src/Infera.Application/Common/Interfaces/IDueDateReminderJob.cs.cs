namespace Infera.Application.Common.Interfaces;

public interface IDueDateReminderJob
{
    System.Threading.Tasks.Task RunAsync(CancellationToken ct);
}