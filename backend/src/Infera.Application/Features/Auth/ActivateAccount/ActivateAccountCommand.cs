using MediatR;

namespace Infera.Application.Features.Auth.ActivateAccount;

public record ActivateAccountCommand(string ActivationToken, string NewPassword) : IRequest;