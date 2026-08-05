using MediatR;

namespace Infera.Application.Features.WorkLogs.GetWorkLogs;

public record GetWorkLogsQuery(Guid TaskId) : IRequest<WorkLogSummaryDto>;

public record WorkLogItemDto(Guid Id, string UserName, int TimeSpentMinutes, string? Description, DateTime LoggedAt);
public record WorkLogSummaryDto(List<WorkLogItemDto> Items, int TotalMinutes);