using MediatR;

namespace Infera.Application.Features.Users.RevokeAllSessions;

public record RevokeAllSessionsCommand(Guid UserId) : IRequest;