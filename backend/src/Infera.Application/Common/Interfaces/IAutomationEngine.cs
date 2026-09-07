namespace Infera.Application.Common.Interfaces;

public interface IAutomationEngine
{
    System.Threading.Tasks.Task ProcessTaskCreatedAsync(Guid taskId, CancellationToken ct = default);
    System.Threading.Tasks.Task ProcessStatusChangedAsync(Guid taskId, string newStatus, CancellationToken ct = default);
    System.Threading.Tasks.Task ProcessTaskAssignedAsync(Guid taskId, Guid? newAssigneeId, CancellationToken ct = default);
    System.Threading.Tasks.Task ProcessCommentAddedAsync(Guid taskId, CancellationToken ct = default);

    // #3: Git tabanli tetikleyiciler -- kullanicinin komut yazmasina GEREK KALMADAN,
    // PM'in tanimladigi kurallara gore otomatik calisirlar.
    System.Threading.Tasks.Task ProcessBranchCreatedAsync(Guid taskId, string branchName, CancellationToken ct = default);
    System.Threading.Tasks.Task ProcessPullRequestOpenedAsync(Guid taskId, string prUrl, CancellationToken ct = default);
    System.Threading.Tasks.Task ProcessPullRequestMergedAsync(Guid taskId, string prUrl, CancellationToken ct = default);
}