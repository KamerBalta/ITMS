using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Sprints.CompleteSprint;

public class CompleteSprintCommandHandler : IRequestHandler<CompleteSprintCommand>
{
    private readonly IAppDbContext _db;
    public CompleteSprintCommandHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task Handle(CompleteSprintCommand request, CancellationToken ct)
    {
        var sprint = await _db.Sprints.FirstOrDefaultAsync(s => s.Id == request.SprintId, ct)
            ?? throw new KeyNotFoundException("Sprint bulunamadı.");

        if (sprint.Status == SprintStatus.Completed)
            throw new InvalidOperationException("Sprint zaten tamamlanmış.");

        // BR-006: Sprint kilitlenince -- tamamlanmamis gorevler otomatik Backlog'a geri doner
        var incompleteTasks = await _db.Tasks
            .Where(t => t.SprintId == sprint.Id && t.Status != ItemStatus.Done)
            .ToListAsync(ct);

        foreach (var task in incompleteTasks)
        {
            task.SprintId = null;
            task.UpdatedAt = DateTime.UtcNow;
        }

        sprint.Status = SprintStatus.Completed;

        await _db.SaveChangesAsync(ct);
    }
}