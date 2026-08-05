using MediatR;

namespace Infera.Application.Features.ChecklistItems.GetChecklistItems;

public record GetChecklistItemsQuery(Guid TaskId) : IRequest<ChecklistSummaryDto>;

public record ChecklistItemDto(Guid Id, string ItemText, bool IsDone);
public record ChecklistSummaryDto(List<ChecklistItemDto> Items, int TotalCount, int DoneCount);