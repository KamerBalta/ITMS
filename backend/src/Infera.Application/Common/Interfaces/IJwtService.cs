namespace Infera.Application.Common.Interfaces;

public interface IJwtService
{
    string GenerateAccessToken(Guid userId, string email, IEnumerable<string> roles);
    (string token, string tokenHash) GenerateRefreshToken();
    string HashRefreshToken(string token);
}