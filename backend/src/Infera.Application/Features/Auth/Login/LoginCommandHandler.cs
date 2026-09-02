using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Auth.Login;

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResult>
{
    private readonly IAppDbContext _db;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtService _jwtService;

    public LoginCommandHandler(IAppDbContext db, IPasswordHasher passwordHasher, IJwtService jwtService)
    {
        _db = db;
        _passwordHasher = passwordHasher;
        _jwtService = jwtService;
    }

    public async Task<LoginResult> Handle(LoginCommand request, CancellationToken ct)
    {
        var user = await _db.Users
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email == request.Email, ct);

        if (user is null || !user.IsActive || !_passwordHasher.Verify(request.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Geçersiz e-posta veya parola.");

        if (user.MustChangePassword)
            throw new UnauthorizedAccessException("Hesabınız henüz aktifleştirilmemiş. Lütfen e-postanıza gönderilen aktivasyon bağlantısını kullanın.");

        var roles = user.UserRoles
     .Select(ur => ur.Role.Name)
     .ToList();

        var accessToken = _jwtService.GenerateAccessToken(
            user.Id,
            user.Email,
            roles,
            user.TokenVersion);

        var (refreshToken, refreshTokenHash) = _jwtService.GenerateRefreshToken();
        user.LastLoginAt = DateTime.UtcNow;
        _db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = refreshTokenHash,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        });

        await _db.SaveChangesAsync(ct);

        return new LoginResult(
            user.Id,
            accessToken,
            refreshToken,
            user.Name,
            user.Email,
            roles
        );
    }
}