namespace Infera.Application.Common.Interfaces;

public interface IEmailService
{
    System.Threading.Tasks.Task SendAsync(string toEmail, string subject, string plainTextBody, CancellationToken ct = default);

    // #1: HTML sablonlu, tiklanabilir butonlu e-posta
    System.Threading.Tasks.Task SendHtmlAsync(
        string toEmail, string subject, string title, string bodyText,
        string? actionUrl = null, string? actionLabel = null, CancellationToken ct = default);
}