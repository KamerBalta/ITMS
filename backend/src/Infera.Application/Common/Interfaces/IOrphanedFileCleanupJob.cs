namespace Infera.Application.Common.Interfaces;

public interface IOrphanedFileCleanupJob
{
    System.Threading.Tasks.Task RunAsync(CancellationToken ct);
}