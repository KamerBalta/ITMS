using Infera.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;

namespace Infera.Infrastructure.Email;

// Faz 1: gercek SMTP yerine konsola yazdiriyoruz. Faz 2'de SendGrid/SMTP ile degistirilecek.
public class ConsoleEmailService : IEmailService
{
    private readonly ILogger<ConsoleEmailService> _logger;
    public ConsoleEmailService(ILogger<ConsoleEmailService> logger) => _logger = logger;

    public System.Threading.Tasks.Task SendAsync(string toEmail, string subject, string body, CancellationToken ct = default)
    {
        _logger.LogInformation("=== E-POSTA (simulasyon) ===\nKime: {To}\nKonu: {Subject}\nİçerik: {Body}\n=============================",
            toEmail, subject, body);
        return System.Threading.Tasks.Task.CompletedTask;
    }
}