using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace Infera.Application.Features.Users.ActivateUser;

public class ActivateUserCommandHandler : IRequestHandler<ActivateUserCommand>
{
    private readonly IAppDbContext _db;
    private readonly IEmailService _emailService;

    public ActivateUserCommandHandler(
        IAppDbContext db,
        IEmailService emailService)
    {
        _db = db;
        _emailService = emailService;
    }

    public async Task Handle(
        ActivateUserCommand request,
        CancellationToken ct)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, ct)
            ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");

        // Zaten aktifse işlemi engelle
        if (user.IsActive)
        {
            throw new InvalidOperationException("Kullanıcı zaten aktif.");
        }

        // Yeni aktivasyon tokenı oluştur
        var rawActivationToken =
            Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));

        var activationTokenHash =
            Convert.ToBase64String(
                SHA256.HashData(
                    Encoding.UTF8.GetBytes(rawActivationToken)));

        // Hesabı yeniden aktifleştirme sürecini başlat
        user.IsActive = true;
        user.MustChangePassword = true;
        user.ActivationTokenHash = activationTokenHash;
        user.ActivationTokenExpiresAt = DateTime.UtcNow.AddDays(7);
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);

        await _emailService.SendAsync(
            user.Email,
            "ITMS - Hesabınızı Yeniden Aktifleştirin",
            $"Hesabınız yeniden aktifleştirildi.\n\n" +
            $"Şifrenizi belirlemek için aşağıdaki bağlantıyı kullanın:\n" +
            $"/activate-account?token={rawActivationToken}",
            ct);
    }
}