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
            .Include(t => t.Project)
            .FirstOrDefaultAsync(t => t.Id == request.ParentTaskId, ct)
            ?? throw new KeyNotFoundException("Üst görev bulunamadı.");

        if (!await _access.HasProjectAccessAsync(parent.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projede alt görev oluşturma yetkiniz yok.");

        if (parent.Sprint is not null && parent.Sprint.Status == SprintStatus.Active)
        {
            var isPrivileged = _currentUser.IsAdmin || _currentUser.Roles.Contains("Project Manager");
            if (!isPrivileged)
                throw new UnauthorizedAccessException("Aktif sprintteki bir göreve yalnızca Project Manager alt görev ekleyebilir.");
        }

        var subtaskAssignment = await _db.ProjectIssueTypeAssignments
            .Include(a => a.IssueType)
            .FirstOrDefaultAsync(a => a.ProjectId == parent.ProjectId && a.IssueType.RequiresParent && a.IssueType.IsActive, ct)
            ?? throw new InvalidOperationException("Bu projeye 'üst göreve bağlı olmalı' (Sub-task benzeri) davranışa sahip bir issue type atanmamış.");

        var subtaskType = subtaskAssignment.IssueType;

        if (request.AssigneeId is not null)
        {
            var assigneeIsMember = await _db.ProjectMembers
                .AnyAsync(m => m.ProjectId == parent.ProjectId && m.UserId == request.AssigneeId, ct);
            if (!assigneeIsMember)
                throw new InvalidOperationException("Atanan kullanıcı bu projenin üyesi değil.");
        }

        var taskNumber = parent.Project.NextTaskNumber;
        parent.Project.NextTaskNumber++;

        var maxRank = await _db.Tasks
            .Where(t => t.ProjectId == parent.ProjectId)
            .Select(t => (long?)t.Rank)
            .MaxAsync(ct) ?? 0;

        var subtask = new Domain.Entities.Task
        {
            ProjectId = parent.ProjectId,
            SprintId = parent.SprintId,
            ParentTaskId = parent.Id,
            IssueTypeId = subtaskType.Id,
            Title = request.Title,
            Priority = parent.Priority,
            Status = ItemStatus.ToDo,
            AssigneeId = request.AssigneeId,
            ReporterId = request.ReporterId,
            Rank = maxRank + 1000,
            TaskNumber = taskNumber,
        };

        _db.Tasks.Add(subtask);
        await _db.SaveChangesAsync(ct);

        return subtask.Id;
    }
}