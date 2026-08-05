using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.ChecklistItems.ToggleChecklistItem;

public class ToggleChecklistItemCommandHandler : IRequestHandler<ToggleChecklistItemCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public ToggleChecklistItemCommandHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task Handle(ToggleChecklistItemCommand request, CancellationToken ct)
    {
        var item = await _db.ChecklistItems.FirstOrDefaultAsync(i => i.Id == request.ItemId, ct)
            ?? throw new KeyNotFoundException("Checklist maddesi bulunamadı.");

        if (!await _access.HasTaskAccessAsync(item.TaskId, ct))
            throw new UnauthorizedAccessException("Bu göreve erişim yetkiniz yok.");

        item.IsDone = !item.IsDone;
        await _db.SaveChangesAsync(ct);
    }
}