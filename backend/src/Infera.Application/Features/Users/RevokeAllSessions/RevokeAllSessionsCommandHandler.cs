using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Users.RevokeAllSessions;

public class RevokeAllSessionsCommandHandler : IRequestHandler<RevokeAllSessionsCommand>
{
    private readonly IAppDbContext _db;
    public RevokeAllSessionsCommandHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task Handle(
     RevokeAllSessionsCommand request,
     CancellationToken ct)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, ct)
            ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");

        var tokens = await _db.RefreshTokens
            .Where(t => t.UserId == request.UserId && t.RevokedAt == null)
            .ToListAsync(ct);

        foreach (var token in tokens)
        {
            token.RevokedAt = DateTime.UtcNow;
        }

        // Bütün mevcut access token'ları da geçersiz hale getir.
        user.TokenVersion = Guid.NewGuid();
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
    }
}