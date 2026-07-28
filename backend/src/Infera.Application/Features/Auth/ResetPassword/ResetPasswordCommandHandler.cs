using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace Infera.Application.Features.Auth.ResetPassword;

public class ResetPasswordCommandHandler : IRequestHandler<ResetPasswordCommand>
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;

    public ResetPasswordCommandHandler(IAppDbContext db, IPasswordHasher passwordHasher)
    {
        _db = db;
        _passwordHasher = passwordHasher;
    }

    public async System.Threading.Tasks.Task Handle(ResetPasswordCommand request, CancellationToken ct)
    {
        var incomingHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(request.ResetToken)));

        var user = await _db.Users.FirstOrDefaultAsync(u => u.PasswordResetTokenHash == incomingHash, ct);

        if (user is null || user.PasswordResetTokenExpiresAt is null || user.PasswordResetTokenExpiresAt < DateTime.UtcNow)
            throw new InvalidOperationException("Token süresi dolmuş veya geçersiz.");

        user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
        user.PasswordResetTokenHash = null;
        user.PasswordResetTokenExpiresAt = null;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
    }
}