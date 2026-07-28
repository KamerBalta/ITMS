using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Tasks.MoveToSprint;

public class MoveToSprintCommandHandler : IRequestHandler<MoveToSprintCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public MoveToSprintCommandHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task Handle(MoveToSprintCommand request, CancellationToken ct)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Görev bulunamadı.");

        if (!await _access.HasProjectAccessAsync(task.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu görevi taşıma yetkiniz yok.");

        if (request.SprintId is not null)
        {
            var sprintValid = await _db.Sprints
                .AnyAsync(s => s.Id == request.SprintId && s.ProjectId == task.ProjectId, ct);
            if (!sprintValid)
                throw new InvalidOperationException("Sprint bu projeye ait değil.");
        }

        task.SprintId = request.SprintId;
        task.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
    }
}