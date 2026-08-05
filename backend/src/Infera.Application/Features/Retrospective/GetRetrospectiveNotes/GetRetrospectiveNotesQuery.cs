using MediatR;

namespace Infera.Application.Features.Retrospective.GetRetrospectiveNotes;

public record GetRetrospectiveNotesQuery(Guid SprintId) : IRequest<List<RetrospectiveNoteDto>>;

public record RetrospectiveNoteDto(Guid Id, string UserName, string Category, string Content, bool IsResolved, DateTime CreatedAt);