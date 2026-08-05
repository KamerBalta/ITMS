using MediatR;

namespace Infera.Application.Features.Backlog.ReorderBacklog;

public record ReorderBacklogCommand(
    List<BacklogRankItem> Items
) : IRequest;

public record BacklogRankItem(
    Guid TaskId,
    long Rank
);