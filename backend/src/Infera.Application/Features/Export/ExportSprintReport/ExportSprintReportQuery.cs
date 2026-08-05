using MediatR;

namespace Infera.Application.Features.Export.ExportSprintReport;

public record ExportSprintReportQuery(Guid SprintId) : IRequest<byte[]>;