using MediatR;

namespace Infera.Application.Features.Auth.Logout;

public record LogoutCommand(string RefreshToken) : IRequest;