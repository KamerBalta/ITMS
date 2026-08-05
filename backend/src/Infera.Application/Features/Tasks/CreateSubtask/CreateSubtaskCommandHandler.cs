using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Tasks.CreateSubtask;

public class CreateSubtaskCommandHandler : IRequestHandler<CreateSubtaskCommand, Guid>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;
    private readonly ICurrentUserService _currentUser;

    public CreateSubtaskCommandHandler(IAppDbContext db, IProjectAccessService access, ICurrentUserService currentUser)
    {
        _db = db;
        _access = access;
        _currentUser = currentUser;
    }

    public async System.Threading.Tasks.Task<Guid> Handle(CreateSubtaskCommand request, CancellationToken ct)
    {
        var parent = await _db.Tasks
            .Include(t => t.Sprint)
            .FirstOrDefaultAsync(t => t.Id == request.ParentTaskId, ct)
            ?? throw new KeyNotFoundException("Üst görev bulunamadı.");

        if (!await _access.HasProjectAccessAsync(parent.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projede alt görev oluşturma yetkiniz yok.");

        var canCreate = _currentUser.IsAdmin
            || _currentUser.Roles.Contains("Project Manager")
            || _currentUser.Roles.Contains("Developer");
        if (!canCreate)
            throw new UnauthorizedAccessException("Alt görev oluşturma yetkiniz yok. Yalnızca Project Manager ve Developer alt görev oluşturabilir.");

        if (parent.Sprint is not null && parent.Sprint.Status == SprintStatus.Active)
        {
            var isPrivileged = _currentUser.IsAdmin || _currentUser.Roles.Contains("Project Manager");
            if (!isPrivileged)
                throw new UnauthorizedAccessException("Aktif sprintteki bir göreve yalnızca Project Manager alt görev ekleyebilir.");
        }

        if (request.AssigneeId is not null)
        {
            var assigneeIsMember = await _db.ProjectMembers
                .AnyAsync(m => m.ProjectId == parent.ProjectId && m.UserId == request.AssigneeId, ct);
            if (!assigneeIsMember)
                throw new InvalidOperationException("Atanan kullanıcı bu projenin üyesi değil.");
        }

        var maxRank = await _db.Tasks
            .Where(t => t.ProjectId == parent.ProjectId)
            .Select(t => (long?)t.Rank)
            .MaxAsync(ct) ?? 0;

        var subtask = new Domain.Entities.Task
        {
            ProjectId = parent.ProjectId,
            SprintId = parent.SprintId,
            ParentTaskId = parent.Id,
            Title = request.Title,
            IssueType = IssueType.SubTask,
            Priority = parent.Priority,
            Status = ItemStatus.ToDo,
            AssigneeId = request.AssigneeId,
            ReporterId = request.ReporterId,
            Rank = maxRank + 1000
        };

        _db.Tasks.Add(subtask);
        await _db.SaveChangesAsync(ct);

        return subtask.Id;
    }
}