namespace Infera.Application.Common.Interfaces;

public interface IBurndownSnapshotJob
{
    System.Threading.Tasks.Task RunAsync(CancellationToken ct);
}