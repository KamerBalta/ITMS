using MediatR;

namespace Infera.Application.Features.AuditLogs.GetTaskAuditHistory;

public record GetTaskAuditHistoryQuery(Guid TaskId) : IRequest<List<AuditHistoryItemDto>>;

public record AuditHistoryItemDto(string FieldName, string? OldValue, string? NewValue, string UserName, DateTime Timestamp);