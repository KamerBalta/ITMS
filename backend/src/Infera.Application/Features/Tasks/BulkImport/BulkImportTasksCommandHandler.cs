using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Tasks.BulkImport;

public class BulkImportTasksCommandHandler : IRequestHandler<BulkImportTasksCommand, BulkImportResultDto>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IProjectManagementAuthService _projectAuth;

    public BulkImportTasksCommandHandler(IAppDbContext db, ICurrentUserService currentUser, IProjectManagementAuthService projectAuth)
    {
        _db = db;
        _currentUser = currentUser;
        _projectAuth = projectAuth;
    }

    public async System.Threading.Tasks.Task<BulkImportResultDto> Handle(BulkImportTasksCommand request, CancellationToken ct)
    {
        // #2: toplu ice aktarma yalnizca PM/Admin -- once yetkisiz kullanicinin
        // yuzlerce gorev olusturmasini engelliyoruz.
        await _projectAuth.EnsureProjectManagerOrAdminAsync(request.ProjectId, ct);

        var project = await _db.Projects.FirstAsync(p => p.Id == request.ProjectId, ct);
        var issueTypes = await _db.ProjectIssueTypeAssignments
            .Where(a => a.ProjectId == request.ProjectId)
            .Include(a => a.IssueType)
            .ToListAsync(ct);
        var members = await _db.ProjectMembers.Include(m => m.User).Where(m => m.ProjectId == request.ProjectId).ToListAsync(ct);
        var initialStatus = await _db.ProjectWorkflowStatuses.FirstAsync(s => s.ProjectId == request.ProjectId && s.IsInitial, ct);
        var maxRank = await _db.Tasks.Where(t => t.ProjectId == request.ProjectId).Select(t => (long?)t.Rank).MaxAsync(ct) ?? 0;

        var errors = new List<ImportRowError>();
        var tempKeyToTaskId = new Dictionary<string, Guid>();

        // #2: Cift gecisli algoritma -- 1. gecis: parent'i OLMAYAN (ya da parent'i disaridan
        // gelen, ayni dosyada olmayan) satirlari once olustur. 2. gecis: parent'i ayni
        // dosyadaki baska bir satira isaret eden (ParentTempKey) satirlari, artik gercek
        // ID'leri bildigimiz icin dogru sekilde baglayarak olustur. Bu, CSV icindeki satir
        // sirasindan BAGIMSIZ calisir (parent, child'dan sonra da yazilmis olabilir).
        var rowsWithoutParentRef = request.Rows.Where(r => string.IsNullOrEmpty(r.ParentTempKey)).ToList();
        var rowsWithParentRef = request.Rows.Where(r => !string.IsNullOrEmpty(r.ParentTempKey)).ToList();

        foreach (var row in rowsWithoutParentRef.Concat(rowsWithParentRef))
        {
            try
            {
                var issueType = issueTypes.FirstOrDefault(a => string.Equals(a.IssueType.Name, row.IssueTypeName, StringComparison.OrdinalIgnoreCase))?.IssueType
                    ?? throw new InvalidOperationException($"'{row.IssueTypeName}' bu projeye tanımlı bir issue type değil.");

                Guid? parentTaskId = null;
                if (!string.IsNullOrEmpty(row.ParentTempKey))
                {
                    if (!tempKeyToTaskId.TryGetValue(row.ParentTempKey, out var resolvedParentId))
                        throw new InvalidOperationException($"Parent referansı '{row.ParentTempKey}' bulunamadı (henüz işlenmemiş ya da geçersiz).");
                    parentTaskId = resolvedParentId;
                }

                if (issueType.RequiresParent && parentTaskId is null)
                    throw new InvalidOperationException($"'{row.IssueTypeName}' tipi için bir Parent referansı (ParentTempKey) zorunludur.");

                Guid? assigneeId = null;
                if (!string.IsNullOrWhiteSpace(row.AssigneeEmail))
                {
                    var member = members.FirstOrDefault(m => string.Equals(m.User.Email, row.AssigneeEmail, StringComparison.OrdinalIgnoreCase));
                    if (member is null)
                        throw new InvalidOperationException($"'{row.AssigneeEmail}' bu projenin üyesi değil.");
                    assigneeId = member.UserId;
                }

                var priority = Enum.TryParse<Priority>(row.Priority, true, out var parsedPriority) ? parsedPriority : Priority.Medium;

                maxRank += 1000;
                var task = new Domain.Entities.Task
                {
                    ProjectId = request.ProjectId,
                    IssueTypeId = issueType.Id,
                    ParentTaskId = parentTaskId,
                    Title = row.Title,
                    Description = row.Description,
                    Priority = priority,
                    StoryPoint = row.StoryPoint,
                    AssigneeId = assigneeId,
                    ReporterId = _currentUser.UserId,
                    StatusId = initialStatus.Id,
                    Rank = maxRank,
                    TaskNumber = project.NextTaskNumber,
                };
                project.NextTaskNumber++;

                _db.Tasks.Add(task);
                await _db.SaveChangesAsync(ct); // her satirdan sonra kaydet -- sonraki satirlar bu Id'ye referans verebilir

                tempKeyToTaskId[row.TempKey] = task.Id;
            }
            catch (Exception ex)
            {
                errors.Add(new ImportRowError(row.TempKey, ex.Message));
            }
        }

        return new BulkImportResultDto(tempKeyToTaskId.Count, errors.Count, errors);
    }
}