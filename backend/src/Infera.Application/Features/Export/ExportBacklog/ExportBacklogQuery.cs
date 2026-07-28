using MediatR;

namespace Infera.Application.Features.Export.ExportBacklog;

public record ExportBacklogQuery(Guid ProjectId) : IRequest<byte[]>;