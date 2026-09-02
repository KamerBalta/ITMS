using System.Security.Cryptography;
using System.Text;
using Infera.Application.Common.Interfaces;

namespace Infera.Infrastructure.Services;

public class WebhookSignatureValidator : IWebhookSignatureValidator
{
    // #Git: GitHub webhook'lari "X-Hub-Signature-256: sha256=<hmac>" header'i gonderir --
    // gelen payload'i secret ile HMAC-SHA256 ile hesaplayip GitHub'in gonderdigiyle
    // sabit-zamanli (timing-attack'e dayanikli) karsilastiriyoruz.
    public bool ValidateGitHubSignature(string payload, string signatureHeader, string secret)
    {
        if (string.IsNullOrEmpty(signatureHeader) || !signatureHeader.StartsWith("sha256=")) return false;

        var expectedSignature = signatureHeader["sha256=".Length..];
        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
        var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(payload));
        var computedSignature = Convert.ToHexString(computedHash).ToLowerInvariant();

        return CryptographicOperations.FixedTimeEquals(
            Encoding.UTF8.GetBytes(computedSignature), Encoding.UTF8.GetBytes(expectedSignature));
    }
}