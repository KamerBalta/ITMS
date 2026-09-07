namespace Infera.Application.Common.Extensions;

public static class TaskUrlExtensions
{
    // #12: Tum bildirim/otomasyon/audit URL'leri BU metod uzerinden uretilmeli --
    // boylece Issue Key formatinda URL uretimi tek bir yerde standartlasir.
    public static string ToTaskDetailUrl(this Domain.Entities.Task task, string projectKey) =>
        $"/browse/{projectKey}-{task.TaskNumber}";
}