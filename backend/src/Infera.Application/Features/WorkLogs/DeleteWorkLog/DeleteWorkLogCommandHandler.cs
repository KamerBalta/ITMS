using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.WorkLogs.DeleteWorkLog;

public class DeleteWorkLogCommandHandler : IRequestHandler<DeleteWorkLogCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IProjectAccessService _access;

    public DeleteWorkLogCommandHandler(IAppDbContext db, ICurrentUserService currentUser, IProjectAccessService access)
    {
        _db = db;
        _currentUser = currentUser;
        _access = access;
    }

    public async System.Threading.Tasks.Task Handle(DeleteWorkLogCommand request, CancellationToken ct)
    {
        var workLog = await _db.WorkLogs.FirstOrDefaultAsync(w => w.Id == request.WorkLogId, ct)
            ?? throw new KeyNotFoundException("Zaman kaydı bulunamadı.");

        if (!await _access.HasTaskAccessAsync(workLog.TaskId, ct))
            throw new UnauthorizedAccessException("Bu göreve erişim yetkiniz yok.");

        if (workLog.UserId != _currentUser.UserId && !_currentUser.IsAdmin)
            throw new UnauthorizedAccessException("Yalnızca kendi zaman kaydınızı silebilirsiniz.");

        _db.WorkLogs.Remove(workLog);
        await _db.SaveChangesAsync(ct);
    }
}