namespace Infera.Application.Common.Interfaces;

public interface IExpiredTokenCleanupJob
{
    System.Threading.Tasks.Task RunAsync(CancellationToken ct);
}