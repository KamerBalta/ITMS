namespace Infera.Application.Common.Interfaces;

public interface IEmailService
{
    System.Threading.Tasks.Task SendAsync(string toEmail, string subject, string body, CancellationToken ct = default);
}