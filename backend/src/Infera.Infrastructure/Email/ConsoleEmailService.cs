using Infera.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace Infera.Infrastructure.Email;

public class ConsoleEmailService : IEmailService
{
    private readonly ILogger<ConsoleEmailService> _logger;
    public ConsoleEmailService(ILogger<ConsoleEmailService> logger) => _logger = logger;

    public System.Threading.Tasks.Task SendAsync(string toEmail, string subject, string plainTextBody, CancellationToken ct = default)
    {
        _logger.LogInformation("=== E-POSTA (simulasyon) ===\nKime: {To}\nKonu: {Subject}\nİçerik: {Body}\n=============================",
            toEmail, subject, plainTextBody);
        return System.Threading.Tasks.Task.CompletedTask;
    }

    public System.Threading.Tasks.Task SendHtmlAsync(
        string toEmail, string subject, string title, string bodyText,
        string? actionUrl = null, string? actionLabel = null, CancellationToken ct = default)
    {
        _logger.LogInformation(
            "=== HTML E-POSTA (simulasyon) ===\nKime: {To}\nKonu: {Subject}\nBaşlık: {Title}\nİçerik: {Body}\nBağlantı: {Url}\n=================================",
            toEmail, subject, title, bodyText, actionUrl ?? "(yok)");
        return System.Threading.Tasks.Task.CompletedTask;
    }
}