using MediatR;

namespace Infera.Application.Features.WorkLogs.DeleteWorkLog;

public record DeleteWorkLogCommand(Guid WorkLogId) : IRequest;