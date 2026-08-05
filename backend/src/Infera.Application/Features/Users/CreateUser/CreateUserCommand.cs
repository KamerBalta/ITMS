using MediatR;

namespace Infera.Application.Features.Users.CreateUser;

public record CreateUserCommand(
    string Name,
    string Email,
    string? Title,
    Guid? ProjectId,
    Guid? TeamId,
    int? ProjectRole,
    string? TeamRole) : IRequest<Guid>;