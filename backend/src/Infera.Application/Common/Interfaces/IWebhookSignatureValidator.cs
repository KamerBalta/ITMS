namespace Infera.Application.Common.Interfaces;

public interface IWebhookSignatureValidator
{
    bool ValidateGitHubSignature(string payload, string signatureHeader, string secret);
}