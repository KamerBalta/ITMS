using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Users.ChangePassword;

public class ChangePasswordCommandHandler : IRequestHandler<ChangePasswordCommand>
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;

    public ChangePasswordCommandHandler(IAppDbContext db, IPasswordHasher passwordHasher)
    {
        _db = db;
        _passwordHasher = passwordHasher;
    }

    public async System.Threading.Tasks.Task Handle(ChangePasswordCommand request, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, ct)
            ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");

        if (!_passwordHasher.Verify(request.CurrentPassword, user.PasswordHash))
            throw new UnauthorizedAccessException("Mevcut parola yanlış.");

        if (request.NewPassword.Length < 8)
            throw new InvalidOperationException("Yeni parola en az 8 karakter olmalıdır.");

        user.PasswordHash = _passwordHasher.Hash(request.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
    }
}