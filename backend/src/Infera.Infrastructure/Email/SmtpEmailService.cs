using Infera.Application.Common.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace Infera.Infrastructure.Email;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger)
    {
        _config = config;
        _logger = logger;
    }

    public System.Threading.Tasks.Task SendAsync(string toEmail, string subject, string plainTextBody, CancellationToken ct = default)
        => SendCoreAsync(toEmail, subject, textPart: plainTextBody, htmlPart: null, ct);

    public System.Threading.Tasks.Task SendHtmlAsync(
        string toEmail, string subject, string title, string bodyText,
        string? actionUrl = null, string? actionLabel = null, CancellationToken ct = default)
    {
        var html = EmailTemplateBuilder.Build(title, bodyText, actionUrl, actionLabel);
        return SendCoreAsync(toEmail, subject, textPart: bodyText, htmlPart: html, ct);
    }

    private async System.Threading.Tasks.Task SendCoreAsync(string toEmail, string subject, string textPart, string? htmlPart, CancellationToken ct)
    {
        var host = _config["Smtp:Host"]!;
        var port = int.Parse(_config["Smtp:Port"]!);
        var username = _config["Smtp:Username"]!;
        var password = _config["Smtp:Password"]!;
        var fromEmail = _config["Smtp:FromEmail"] ?? username;
        var fromName = _config["Smtp:FromName"] ?? "Infera ITMS";

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(fromName, fromEmail));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;

        var builder = new BodyBuilder { TextBody = textPart, HtmlBody = htmlPart };
        message.Body = builder.ToMessageBody();

        using var client = new SmtpClient();
        try
        {
            await client.ConnectAsync(host, port, SecureSocketOptions.StartTls, ct);
            await client.AuthenticateAsync(username, password, ct);
            await client.SendAsync(message, ct);
        }
        finally
        {
            if (client.IsConnected)
                await client.DisconnectAsync(true, ct);
        }

        _logger.LogInformation("E-posta gönderildi: {ToEmail} - {Subject}", toEmail, subject);
    }
}