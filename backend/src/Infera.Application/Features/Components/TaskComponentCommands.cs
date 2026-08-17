using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Components;

public record AddComponentToTaskCommand(Guid TaskId, Guid ComponentId) : IRequest;
public record RemoveComponentFromTaskCommand(Guid TaskId, Guid ComponentId) : IRequest;

public class AddComponentToTaskCommandHandler : IRequestHandler<AddComponentToTaskCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;
    public AddComponentToTaskCommandHandler(IAppDbContext db, IProjectAccessService access) { _db = db; _access = access; }

    public async System.Threading.Tasks.Task Handle(AddComponentToTaskCommand request, CancellationToken ct)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == request.TaskId, ct) ?? throw new KeyNotFoundException("Görev bulunamadı.");
        if (!await _access.HasProjectAccessAsync(task.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu göreve erişim yetkiniz yok.");

        var component = await _db.ProjectComponents.FirstOrDefaultAsync(c => c.Id == request.ComponentId && c.ProjectId == task.ProjectId, ct)
            ?? throw new KeyNotFoundException("Bu proje için tanımlı böyle bir component yok.");

        var alreadyLinked = await _db.TaskComponents.AnyAsync(tc => tc.TaskId == request.TaskId && tc.ProjectComponentId == request.ComponentId, ct);
        if (alreadyLinked) throw new InvalidOperationException("Bu component zaten göreve eklenmiş.");

        _db.TaskComponents.Add(new TaskComponent { TaskId = request.TaskId, ProjectComponentId = request.ComponentId });
        await _db.SaveChangesAsync(ct);
    }
}

public class RemoveComponentFromTaskCommandHandler : IRequestHandler<RemoveComponentFromTaskCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;
    public RemoveComponentFromTaskCommandHandler(IAppDbContext db, IProjectAccessService access) { _db = db; _access = access; }

    public async System.Threading.Tasks.Task Handle(RemoveComponentFromTaskCommand request, CancellationToken ct)
    {
        var link = await _db.TaskComponents.FirstOrDefaultAsync(tc => tc.TaskId == request.TaskId && tc.ProjectComponentId == request.ComponentId, ct)
            ?? throw new KeyNotFoundException("Bu component görevde bulunamadı.");

        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == request.TaskId, ct);
        if (task is not null && !await _access.HasProjectAccessAsync(task.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu göreve erişim yetkiniz yok.");

        _db.TaskComponents.Remove(link);
        await _db.SaveChangesAsync(ct);
    }
}