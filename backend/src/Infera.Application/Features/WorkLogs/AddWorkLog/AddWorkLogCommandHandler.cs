using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.WorkLogs.AddWorkLog;

public class AddWorkLogCommandHandler : IRequestHandler<AddWorkLogCommand, Guid>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public AddWorkLogCommandHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<Guid> Handle(AddWorkLogCommand request, CancellationToken ct)
    {
        var taskExists = await _db.Tasks.AnyAsync(t => t.Id == request.TaskId, ct);
        if (!taskExists)
            throw new KeyNotFoundException("Görev bulunamadı.");

        if (!await _access.HasTaskAccessAsync(request.TaskId, ct))
            throw new UnauthorizedAccessException("Bu göreve zaman kaydı ekleme yetkiniz yok.");

        if (request.TimeSpentMinutes <= 0)
            throw new InvalidOperationException("Harcanan süre 0'dan büyük olmalıdır.");

        var workLog = new WorkLog
        {
            TaskId = request.TaskId,
            UserId = request.UserId,
            TimeSpentMinutes = request.TimeSpentMinutes,
            Description = request.Description
        };

        _db.WorkLogs.Add(workLog);
        await _db.SaveChangesAsync(ct);

        return workLog.Id;
    }
}