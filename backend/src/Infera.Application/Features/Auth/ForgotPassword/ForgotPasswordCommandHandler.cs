using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace Infera.Application.Features.Auth.ForgotPassword;

public class ForgotPasswordCommandHandler : IRequestHandler<ForgotPasswordCommand>
{
    private readonly IAppDbContext _db;
    private readonly IEmailService _emailService;

    public ForgotPasswordCommandHandler(IAppDbContext db, IEmailService emailService)
    {
        _db = db;
        _emailService = emailService;
    }

    public async System.Threading.Tasks.Task Handle(ForgotPasswordCommand request, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == request.Email, ct);

        // Guvenlik: kullanici bulunamasa bile 404 donmuyoruz burada (enumeration'i onlemek icin
        // API katmaninda 404 gosterecegiz ama DB'de kayit yoksa islem yapmadan sessizce cikiyoruz)
        if (user is null || !user.IsActive)
            return;

        var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(48));
        var tokenHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(rawToken)));

        user.PasswordResetTokenHash = tokenHash;
        user.PasswordResetTokenExpiresAt = DateTime.UtcNow.AddMinutes(30);
        await _db.SaveChangesAsync(ct);

        await _emailService.SendAsync(
            user.Email,
            "ITMS - Parola Sıfırlama",
            $"Parolanızı sıfırlamak için token: {rawToken} (30 dakika geçerlidir)",
            ct);
    }
}