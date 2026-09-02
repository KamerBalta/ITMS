using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Tasks.GetTaskById;

public class GetTaskByIdQueryHandler : IRequestHandler<GetTaskByIdQuery, TaskDetailDto>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetTaskByIdQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async Task<TaskDetailDto> Handle(GetTaskByIdQuery request, CancellationToken ct)
    {
        var task = await _db.Tasks.AsSplitQuery()
            .Where(t => t.Id == request.TaskId)
            .Select(t => new TaskDetailDto(
                t.Id,
                t.Title,
                t.Description,
                t.IssueType != null ? t.IssueType.Name : "-",
                t.IssueType != null ? t.IssueType.Icon : null,
                t.IssueTypeId,
                t.IssueType != null && t.IssueType.AllowsChildren,
                t.IssueType != null && t.IssueType.RequiresParent,
                t.Priority.ToString(),
                t.WorkflowStatus.Name,
                t.StatusId,
                t.StoryPoint,
                t.ProjectId,
                t.Project.Name,
                t.Project.Key,
                t.Project.Key + "-" + t.TaskNumber,
                t.SprintId,
                t.ParentTaskId,
                t.Assignee != null ? t.Assignee.Name : null,
                t.Reporter.Name,
                t.DueDate,
                t.CreatedAt,
                t.UpdatedAt,
                t.TaskLabels.Select(tl => tl.Label.Name).ToList(),
                t.Comments.Count,
                t.Attachments.Count,
                t.ChecklistItems.Count,
                t.ChecklistItems.Count(c => c.IsDone),
                t.Watchers.Count,
                t.ReleaseId,
                t.Release != null ? t.Release.Version : null,
                _db.TaskComponents
                    .Where(tc => tc.TaskId == t.Id)
                    .Select(tc => new TaskComponentDto(
                        tc.ProjectComponentId,
                        tc.ProjectComponent.Name,
                        tc.ProjectComponent.LeadUserId,
                        tc.ProjectComponent.LeadUser != null
                            ? tc.ProjectComponent.LeadUser.Name
                            : null))
                    .ToList(),
                t.OriginalEstimateMinutes,
                t.RemainingEstimateMinutes))
            .FirstOrDefaultAsync(ct);

        if (task is null)
            throw new KeyNotFoundException("Görev bulunamadı.");

        if (!await _access.HasProjectAccessAsync(task.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu göreve erişim yetkiniz yok.");

        return task;
    }
}