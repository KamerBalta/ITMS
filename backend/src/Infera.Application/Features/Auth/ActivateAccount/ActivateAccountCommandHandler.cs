using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace Infera.Application.Features.Auth.ActivateAccount;

public class ActivateAccountCommandHandler : IRequestHandler<ActivateAccountCommand>
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;

    public ActivateAccountCommandHandler(IAppDbContext db, IPasswordHasher passwordHasher)
    {
        _db = db;
        _passwordHasher = passwordHasher;
    }

    public async System.Threading.Tasks.Task Handle(ActivateAccountCommand request, CancellationToken ct)
    {
        var incomingHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(request.ActivationToken)));

        var user = await _db.Users.FirstOrDefaultAsync(u => u.ActivationTokenHash == incomingHash, ct);

        if (user is null || user.ActivationTokenExpiresAt is null || user.ActivationTokenExpiresAt < DateTime.UtcNow)
            throw new InvalidOperationException("Aktivasyon bağlantısının süresi dolmuş veya geçersiz.");

        user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
        user.MustChangePassword = false;
        user.ActivationTokenHash = null;
        user.ActivationTokenExpiresAt = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
    }
}