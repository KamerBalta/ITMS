namespace Infera.Application.Common.Interfaces;

public interface IComponentLeadDigestJob
{
    System.Threading.Tasks.Task RunAsync(CancellationToken ct);
}