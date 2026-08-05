using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.ChecklistItems.AddChecklistItem;

public class AddChecklistItemCommandHandler : IRequestHandler<AddChecklistItemCommand, Guid>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public AddChecklistItemCommandHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<Guid> Handle(AddChecklistItemCommand request, CancellationToken ct)
    {
        var taskExists = await _db.Tasks.AnyAsync(t => t.Id == request.TaskId, ct);
        if (!taskExists)
            throw new KeyNotFoundException("Görev bulunamadı.");

        if (!await _access.HasTaskAccessAsync(request.TaskId, ct))
            throw new UnauthorizedAccessException("Bu göreve checklist maddesi ekleme yetkiniz yok.");

        if (string.IsNullOrWhiteSpace(request.ItemText))
            throw new InvalidOperationException("Checklist madde metni boş olamaz.");

        var item = new ChecklistItem { TaskId = request.TaskId, ItemText = request.ItemText };
        _db.ChecklistItems.Add(item);
        await _db.SaveChangesAsync(ct);

        return item.Id;
    }
}