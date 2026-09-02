using MediatR;

namespace Infera.Application.Features.Tasks.BulkUpdateStatus;

public record BulkUpdateStatusCommand(List<Guid> TaskIds, Guid NewStatusId) : IRequest<BulkActionResultDto>;

public record BulkActionResultDto(int SuccessCount, int FailCount, List<string> Errors);