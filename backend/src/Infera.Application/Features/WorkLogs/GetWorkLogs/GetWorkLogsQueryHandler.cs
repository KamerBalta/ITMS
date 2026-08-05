using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.WorkLogs.GetWorkLogs;

public class GetWorkLogsQueryHandler : IRequestHandler<GetWorkLogsQuery, WorkLogSummaryDto>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetWorkLogsQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<WorkLogSummaryDto> Handle(GetWorkLogsQuery request, CancellationToken ct)
    {
        if (!await _access.HasTaskAccessAsync(request.TaskId, ct))
            throw new UnauthorizedAccessException("Bu göreve erişim yetkiniz yok.");

        var items = await _db.WorkLogs
            .Where(w => w.TaskId == request.TaskId)
            .OrderByDescending(w => w.LoggedAt)
            .Select(w => new WorkLogItemDto(w.Id, w.User.Name, w.TimeSpentMinutes, w.Description, w.LoggedAt))
            .ToListAsync(ct);

        return new WorkLogSummaryDto(items, items.Sum(i => i.TimeSpentMinutes));
    }
}