using MediatR;

namespace Infera.Application.Features.Export.ExportAuditLogs;

public record ExportAuditLogsQuery : IRequest<byte[]>;