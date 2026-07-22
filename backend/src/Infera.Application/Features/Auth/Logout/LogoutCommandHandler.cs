using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Auth.Logout;

public class LogoutCommandHandler : IRequestHandler<LogoutCommand>
{
    private readonly IAppDbContext _db;
    private readonly IJwtService _jwtService;

    public LogoutCommandHandler(IAppDbContext db, IJwtService jwtService)
    {
        _db = db;
        _jwtService = jwtService;
    }

    public async Task Handle(LogoutCommand request, CancellationToken ct)
    {
        var hash = _jwtService.HashRefreshToken(request.RefreshToken);
        var token = await _db.RefreshTokens.FirstOrDefaultAsync(rt => rt.TokenHash == hash, ct);

        if (token is not null && token.RevokedAt is null)
        {
            token.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
        // Token zaten yoksa/iptalse sessizce basariya donuyoruz -- logout idempotent olmali
    }
}