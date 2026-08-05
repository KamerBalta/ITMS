using MediatR;

namespace Infera.Application.Features.ChecklistItems.AddChecklistItem;

public record AddChecklistItemCommand(Guid TaskId, string ItemText) : IRequest<Guid>;