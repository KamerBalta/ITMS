using MediatR;

namespace Infera.Application.Features.Retrospective.ToggleActionItem;

public record ToggleActionItemCommand(Guid NoteId) : IRequest;