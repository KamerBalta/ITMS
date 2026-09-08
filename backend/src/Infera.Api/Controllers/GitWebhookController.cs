using System.Text;
using System.Text.Json;
using Infera.Application.Common.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Infera.Api.Controllers;

[ApiController]
[Route("api/v1/webhooks/git")]
public class GitWebhookController : ControllerBase
{
    private readonly IAppDbContext _db;
    private readonly IGitWebhookProcessor _processor;
    private readonly IWebhookSignatureValidator _signatureValidator;

    public GitWebhookController(
        IAppDbContext db,
        IGitWebhookProcessor processor,
        IWebhookSignatureValidator signatureValidator)
    {
        _db = db;
        _processor = processor;
        _signatureValidator = signatureValidator;
    }

    [HttpPost("azure-devops/{projectId}/{secret}")]
    public async Task<IActionResult> ReceiveAzureDevOpsWebhook(Guid projectId, string secret)
    {
        var integration = await _db.ProjectGitIntegrations.FirstOrDefaultAsync(g => g.ProjectId == projectId && g.IsActive);
        if (integration is null) return NotFound();

        // #TFVC: Azure DevOps webhook'lari HMAC imzasi GONDERMEZ -- guvenlik, URL'in kendisine
        // gomulu, tahmin edilemez (32 byte rastgele) secret ile saglanir. Bu, GitHub'dan daha
        // az saglam bir yontem ama Azure DevOps'un servis kancalarinin (Service Hooks) desteklediği
        // tek pratik dogrulama sekli budur.
        if (secret != integration.WebhookSecret) return Unauthorized(new { message = "Geçersiz webhook secret." });

        using var reader = new StreamReader(Request.Body, Encoding.UTF8);
        var payload = await reader.ReadToEndAsync();

        using var doc = JsonDocument.Parse(payload);
        var eventType = doc.RootElement.TryGetProperty("eventType", out var eventTypeEl) ? eventTypeEl.GetString() : null;

        switch (eventType)
        {
            case "tfvc.checkin":
                await _processor.ProcessAzureDevOpsCheckinAsync(projectId, payload);
                break;
            case "build.complete":
                await _processor.ProcessAzureDevOpsBuildAsync(projectId, payload);
                break;
            case "ms.vss-release.deployment-completed-event":
                await _processor.ProcessAzureDevOpsReleaseAsync(projectId, payload);
                break;
        }

        return Ok();
    }

    [HttpPost("{projectId}")]
    public async Task<IActionResult> ReceiveGitHubWebhook(Guid projectId)
    {
        Request.EnableBuffering();

        using var reader = new StreamReader(
            Request.Body,
            Encoding.UTF8,
            leaveOpen: true);

        var payload = await reader.ReadToEndAsync();
        Request.Body.Position = 0;

        var integration = await _db.ProjectGitIntegrations
            .FirstOrDefaultAsync(
                g => g.ProjectId == projectId && g.IsActive);

        if (integration is null)
            return NotFound();

        var signatureHeader =
            Request.Headers["X-Hub-Signature-256"].ToString();

        // Webhook secret şu anda düz metin olarak saklanıyor.
        if (!_signatureValidator.ValidateGitHubSignature(
                payload,
                signatureHeader,
                integration.WebhookSecret))
        {
            return Unauthorized(new
            {
                message = "Geçersiz webhook imzası."
            });
        }

        var eventType = Request.Headers["X-GitHub-Event"].ToString();

        if (eventType == "push")
        {
            await _processor.ProcessGitHubPushAsync(projectId, payload);
        }
        else if (eventType == "create")
        {
            await _processor.ProcessGitHubBranchCreatedAsync(projectId, payload);
        }
        else if (eventType == "pull_request")
        {
            await _processor.ProcessGitHubPullRequestAsync(projectId, payload);
        }

        return Ok();
    }
}