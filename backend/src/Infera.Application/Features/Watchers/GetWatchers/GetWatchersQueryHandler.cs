using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Watchers.GetWatchers;

public class GetWatchersQueryHandler : IRequestHandler<GetWatchersQuery, List<WatcherDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetWatchersQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<List<WatcherDto>> Handle(GetWatchersQuery request, CancellationToken ct)
    {
        if (!await _access.HasTaskAccessAsync(request.TaskId, ct))
            throw new UnauthorizedAccessException("Bu göreve erişim yetkiniz yok.");

        return await _db.Watchers
            .Where(w => w.TaskId == request.TaskId)
            .Select(w => new WatcherDto(w.UserId, w.User.Name))
            .ToListAsync(ct);
    }
}