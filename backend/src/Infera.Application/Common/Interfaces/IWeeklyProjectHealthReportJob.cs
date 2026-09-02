namespace Infera.Application.Common.Interfaces;

public interface IWeeklyProjectHealthReportJob
{
    System.Threading.Tasks.Task RunAsync(CancellationToken ct);
}