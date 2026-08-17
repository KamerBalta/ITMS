using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using Infera.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Infera.Application.Common.Services;

public class NotificationService : INotificationService
{
    private readonly IAppDbContext _db;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _config;

    public NotificationService(IAppDbContext db, IEmailService emailService, IConfiguration config)
    {
        _db = db;
        _emailService = emailService;
        _config = config;
    }

    public async System.Threading.Tasks.Task NotifyAsync(
        Guid userId, string title, string message, NotificationType type,
        string? actionUrl = null, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null || !user.IsActive) return;

        var pref = await _db.NotificationPreferences
            .FirstOrDefaultAsync(p => p.UserId == userId && p.NotificationType == type.ToString(), ct);

        var inAppEnabled = pref?.InAppEnabled ?? true;
        var emailEnabled = pref?.EmailEnabled ?? true;
        var emailFrequency = pref?.EmailFrequency ?? "Instant";

        var fullActionUrl = actionUrl is not null
            ? $"{_config["Frontend:BaseUrl"]?.TrimEnd('/')}{actionUrl}"
            : null;

        if (inAppEnabled)
        {
            _db.Notifications.Add(new Notification
            {
                UserId = userId,
                Title = title,
                Message = message,
                Type = type,
                IsRead = false,
                ActionUrl = actionUrl,
            });
            await _db.SaveChangesAsync(ct);
        }

        if (!emailEnabled) return;

        if (emailFrequency == "DailyDigest")
        {
            // #Yuksek-7: anlik gondermek yerine biriktir -- Hangfire her gun tek seferde ozetleyip gonderir.
            _db.PendingDigestEmails.Add(new PendingDigestEmail
            {
                UserId = userId,
                Title = title,
                Message = message,
                ActionUrl = fullActionUrl,
            });
            await _db.SaveChangesAsync(ct);
        }
        else
        {
            await _emailService.SendHtmlAsync(user.Email, title, title, message, fullActionUrl, GetActionLabel(type), ct);
        }
    }

    private static string GetActionLabel(NotificationType type) => type switch
    {
        NotificationType.Task => "Görevi Görüntüle",
        NotificationType.Sprint => "Sprinti Aç",
        NotificationType.Mention => "Yorumu Görüntüle",
        NotificationType.Release => "Release'i Görüntüle",
        _ => "Görüntüle",
    };
}