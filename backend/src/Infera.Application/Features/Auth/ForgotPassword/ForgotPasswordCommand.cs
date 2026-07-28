using MediatR;

namespace Infera.Application.Features.Auth.ForgotPassword;

public record ForgotPasswordCommand(string Email) : IRequest;