using MediatR;

namespace Infera.Application.Features.Users.ChangePassword;

public record ChangePasswordCommand(Guid UserId, string CurrentPassword, string NewPassword) : IRequest;