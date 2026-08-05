using MediatR;

namespace Infera.Application.Features.Auth.Login;

public record LoginCommand(string Email, string Password) : IRequest<LoginResult>;

public record LoginResult(
    Guid UserId,
    string AccessToken,
    string RefreshToken,
    string UserName,
    string Email,
    List<string> Roles
);