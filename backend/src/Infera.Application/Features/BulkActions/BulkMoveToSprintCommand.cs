using MediatR;

namespace Infera.Application.Features.Tasks.BulkActions;

public record BulkMoveToSprintCommand(List<Guid> TaskIds, Guid? SprintId) : IRequest<BulkActionResultDto>;
public record BulkAddLabelCommand(List<Guid> TaskIds, Guid LabelId) : IRequest<BulkActionResultDto>;
public record BulkDeleteCommand(List<Guid> TaskIds) : IRequest<BulkActionResultDto>;

public record BulkActionResultDto(int SuccessCount, int FailCount, List<string> Errors);