using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Tasks.UpdateTaskStatus;

public class UpdateTaskStatusCommandHandler : IRequestHandler<UpdateTaskStatusCommand>
{
    private readonly IAppDbContext _db;
    public UpdateTaskStatusCommandHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task Handle(UpdateTaskStatusCommand request, CancellationToken ct)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == request.TaskId, ct)
            ?? throw new KeyNotFoundException("Görev bulunamadı.");

        task.Status = request.NewStatus;
        task.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
    }
}