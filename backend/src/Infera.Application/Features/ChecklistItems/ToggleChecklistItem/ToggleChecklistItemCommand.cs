using MediatR;

namespace Infera.Application.Features.ChecklistItems.ToggleChecklistItem;

public record ToggleChecklistItemCommand(Guid ItemId) : IRequest;