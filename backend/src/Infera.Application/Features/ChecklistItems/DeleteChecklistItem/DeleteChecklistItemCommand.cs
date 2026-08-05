using MediatR;

namespace Infera.Application.Features.ChecklistItems.DeleteChecklistItem;

public record DeleteChecklistItemCommand(Guid ItemId) : IRequest;