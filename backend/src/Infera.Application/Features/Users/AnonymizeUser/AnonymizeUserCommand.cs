using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Users.AnonymizeUser;

public record AnonymizeUserCommand(Guid UserId) : IRequest;

public class AnonymizeUserCommandHandler : IRequestHandler<AnonymizeUserCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public AnonymizeUserCommandHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task Handle(AnonymizeUserCommand request, CancellationToken ct)
    {
        if (!_currentUser.IsAdmin)
            throw new UnauthorizedAccessException("Yalnızca System Admin bir kullanıcıyı anonimleştirebilir.");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, ct)
            ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");

      
        user.Name = "Silinmiş Kullanıcı";
        user.Email = $"deleted-{user.Id}@anonymized.local";
        user.IsActive = false;
        user.AvatarUrl = null;
        user.PasswordHash = Guid.NewGuid().ToString(); // giris yapilamaz hale getir

        var tokens = await _db.RefreshTokens.Where(t => t.UserId == user.Id && t.RevokedAt == null).ToListAsync(ct);
        foreach (var token in tokens) token.RevokedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
    }
}