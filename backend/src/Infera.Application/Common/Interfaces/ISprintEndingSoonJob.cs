namespace Infera.Application.Common.Interfaces;

public interface ISprintEndingSoonJob
{
    System.Threading.Tasks.Task RunAsync(CancellationToken ct);
}