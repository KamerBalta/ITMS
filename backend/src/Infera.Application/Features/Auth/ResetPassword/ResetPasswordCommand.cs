using MediatR;

namespace Infera.Application.Features.Auth.ResetPassword;

public record ResetPasswordCommand(string ResetToken, string NewPassword) : IRequest;