using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Users.DeactivateUser;

public class DeactivateUserCommandHandler : IRequestHandler<DeactivateUserCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public DeactivateUserCommandHandler(IAppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async System.Threading.Tasks.Task Handle(DeactivateUserCommand request, CancellationToken ct)
    {
        if (request.UserId == _currentUser.UserId)
            throw new InvalidOperationException("Kendi hesabınızı pasifleştiremezsiniz.");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, ct)
            ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");

        // DB-003 Soft Delete ilkesi -- kayit silinmiyor, sadece pasiflestiriliyor
        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;

        // Aktif oturumlarini da iptal et -- pasif kullanici token yenileyemesin
        var activeTokens = await _db.RefreshTokens
            .Where(rt => rt.UserId == request.UserId && rt.RevokedAt == null)
            .ToListAsync(ct);
        foreach (var token in activeTokens)
            token.RevokedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
    }
}