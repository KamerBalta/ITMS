using Infera.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Infera.Infrastructure.BackgroundJobs;

public class ExpiredTokenCleanupService : IExpiredTokenCleanupJob
{
    private readonly IAppDbContext _db;
    public ExpiredTokenCleanupService(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task RunAsync(CancellationToken ct)
    {
        var now = DateTime.UtcNow;

        // Suresi dolmus (ve/veya zaten iptal edilmis, RevokeAllSessions ile) refresh token'lar --
        // gecmis denetim ihtiyaci olmadigi icin tamamen silinebilirler.
        var expiredRefreshTokens = await _db.RefreshTokens
            .Where(t => t.ExpiresAt < now || t.RevokedAt != null)
            .ToListAsync(ct);
        _db.RefreshTokens.RemoveRange(expiredRefreshTokens);

        // Suresi dolmus hesap aktivasyon token'lari -- 7 gunluk gecerlilik suresi zaten vardi.
        var usersWithExpiredActivation = await _db.Users
            .Where(u => u.ActivationTokenExpiresAt != null && u.ActivationTokenExpiresAt < now)
            .ToListAsync(ct);
        foreach (var user in usersWithExpiredActivation)
        {
            user.ActivationTokenHash = null;
            user.ActivationTokenExpiresAt = null;
        }

        // Suresi dolmus parola sifirlama token'lari.
        var usersWithExpiredReset = await _db.Users
            .Where(u => u.PasswordResetTokenExpiresAt != null && u.PasswordResetTokenExpiresAt < now)
            .ToListAsync(ct);
        foreach (var user in usersWithExpiredReset)
        {
            user.PasswordResetTokenHash = null;
            user.PasswordResetTokenExpiresAt = null;
        }

        // 90 gunden eski, artik toplanmis (islenmis) burndown snapshot'lari degil -- bunlara dokunmuyoruz,
        // grafik gecmisi icin kalicilar. Yalnizca gercekten "cop" olan kayitlari temizliyoruz.

        // #16: bir BoardColumn silinince, ona ait BoardColumnSettings (WIP limit) kaydi FK
        // constraint'i sayesinde zaten CASCADE ile silinmis olmali -- ama emin olmak icin,
        // hicbir gercek Column'a karsilik gelmeyen "yetim" ayarlari da temizliyoruz.
        var orphanedSettings = await _db.BoardColumnSettings
            .Where(s => !_db.BoardColumns.Any(c => c.Id == s.BoardColumnId))
            .ToListAsync(ct);
        _db.BoardColumnSettings.RemoveRange(orphanedSettings);

        await _db.SaveChangesAsync(ct);
    }
}