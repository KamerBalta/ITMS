namespace Infera.Application.Common.Interfaces;

public interface IDigestEmailJob
{
    System.Threading.Tasks.Task RunAsync(CancellationToken ct);
}