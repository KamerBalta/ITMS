namespace Infera.Application.Common.Interfaces;

public interface IGitWebhookProcessor
{
    System.Threading.Tasks.Task ProcessGitHubPushAsync(Guid projectId, string payloadJson, CancellationToken ct = default);
}