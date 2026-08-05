using MediatR;

namespace Infera.Application.Features.Retrospective.AddRetrospectiveNote;

public record AddRetrospectiveNoteCommand(Guid SprintId, Guid UserId, string Category, string Content) : IRequest<Guid>;