using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Auth.Refresh;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, RefreshTokenResult>
{
    private readonly IAppDbContext _db;
    private readonly IJwtService _jwtService;

    public RefreshTokenCommandHandler(IAppDbContext db, IJwtService jwtService)
    {
        _db = db;
        _jwtService = jwtService;
    }

    public async Task<RefreshTokenResult> Handle(RefreshTokenCommand request, CancellationToken ct)
    {
        var incomingHash = _jwtService.HashRefreshToken(request.RefreshToken);

        var existing = await _db.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.TokenHash == incomingHash, ct);

        if (existing is null || existing.RevokedAt is not null || existing.ExpiresAt < DateTime.UtcNow)
            throw new UnauthorizedAccessException("Refresh token geçersiz veya süresi dolmuş.");

        var user = await _db.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == existing.UserId, ct);

        if (user is null || !user.IsActive)
            throw new UnauthorizedAccessException("Kullanıcı bulunamadı veya pasif.");

        // Eskiyi iptal et (DB-010: RevokedAt ile gecersiz kilinir), yenisini ver -- token rotation
        existing.RevokedAt = DateTime.UtcNow;

        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        var newAccessToken = _jwtService.GenerateAccessToken(user.Id, user.Email, roles, user.TokenVersion);
        var (newRefreshToken, newHash) = _jwtService.GenerateRefreshToken();

        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = newHash,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        });

        await _db.SaveChangesAsync(ct);

        return new RefreshTokenResult(newAccessToken, newRefreshToken);
    }
}