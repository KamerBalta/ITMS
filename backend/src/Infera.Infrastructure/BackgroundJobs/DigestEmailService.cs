using Infera.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infera.Infrastructure.BackgroundJobs;

public class DigestEmailService : IDigestEmailJob
{
    private readonly IAppDbContext _db;
    private readonly IEmailService _emailService;

    public DigestEmailService(IAppDbContext db, IEmailService emailService)
    {
        _db = db;
        _emailService = emailService;
    }

    public async System.Threading.Tasks.Task RunAsync(CancellationToken ct)
    {
        var pendingByUser = await _db.PendingDigestEmails
            .Include(p => p.User)
            .ToListAsync(ct);

        var grouped = pendingByUser.GroupBy(p => p.UserId);

        foreach (var group in grouped)
        {
            var user = group.First().User;
            if (!user.IsActive) continue;

            var itemsHtml = string.Join("", group.Select(p =>
                $"<li style=\"margin-bottom:8px;\"><strong>{System.Net.WebUtility.HtmlEncode(p.Title)}</strong><br/>" +
                $"<span style=\"color:#6b7280;font-size:13px;\">{System.Net.WebUtility.HtmlEncode(p.Message)}</span></li>"));

            var body = $"Bugün {group.Count()} bildiriminiz oldu. Aşağıda özetini bulabilirsiniz.";
            var bodyHtml = $"<ul style=\"padding-left:18px;margin:0;\">{itemsHtml}</ul>";

            await _emailService.SendHtmlAsync(
                user.Email,
                $"Günlük Özet — {group.Count()} bildirim",
                "Günlük Bildirim Özeti",
                body + "<br/><br/>" + bodyHtml,
                null,
                null,
                ct);
        }

        // Gonderilen tum bekleyen kayitlari temizle
        _db.PendingDigestEmails.RemoveRange(pendingByUser);
        await _db.SaveChangesAsync(ct);
    }
}