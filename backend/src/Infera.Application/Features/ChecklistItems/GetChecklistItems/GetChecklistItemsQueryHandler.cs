using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.ChecklistItems.GetChecklistItems;

public class GetChecklistItemsQueryHandler : IRequestHandler<GetChecklistItemsQuery, ChecklistSummaryDto>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetChecklistItemsQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<ChecklistSummaryDto> Handle(GetChecklistItemsQuery request, CancellationToken ct)
    {
        if (!await _access.HasTaskAccessAsync(request.TaskId, ct))
            throw new UnauthorizedAccessException("Bu göreve erişim yetkiniz yok.");

        var items = await _db.ChecklistItems
            .Where(i => i.TaskId == request.TaskId)
            .OrderBy(i => i.CreatedAt)
            .Select(i => new ChecklistItemDto(i.Id, i.ItemText, i.IsDone))
            .ToListAsync(ct);

        return new ChecklistSummaryDto(items, items.Count, items.Count(i => i.IsDone));
    }
}