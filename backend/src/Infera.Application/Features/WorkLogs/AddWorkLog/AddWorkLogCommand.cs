using MediatR;

namespace Infera.Application.Features.WorkLogs.AddWorkLog;

public record AddWorkLogCommand(Guid TaskId, Guid UserId, int TimeSpentMinutes, string? Description) : IRequest<Guid>;