using MediatR;

namespace Infera.Application.Features.Users.CreateUser;

public record CreateUserCommand(string Name, string Email, string Password, string? Title) : IRequest<Guid>;