namespace Infera.Application.Common.Interfaces;

public interface IInactiveUserDetectionJob
{
    System.Threading.Tasks.Task RunAsync(CancellationToken ct);
}