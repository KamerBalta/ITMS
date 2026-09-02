using Infera.Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using MediatR;

namespace Infera.Application.Features.Projects.DeleteProject;

public class DeleteProjectCommandHandler : IRequestHandler<DeleteProjectCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IFileStorageService _fileStorage;

    public DeleteProjectCommandHandler(IAppDbContext db, ICurrentUserService currentUser, IFileStorageService fileStorage)
    {
        _db = db;
        _currentUser = currentUser;
        _fileStorage = fileStorage;
    }

    public async System.Threading.Tasks.Task Handle(DeleteProjectCommand request, CancellationToken ct)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.Id == request.ProjectId, ct)
            ?? throw new KeyNotFoundException("Proje bulunamadı.");

        // #5: Yalniz Admin YA DA bu projenin sahibi olan Project Manager silebilir.
        // (Genel "ProjectManager rolu" yeterli degil -- ozellikle silme gibi geri donusu olmayan
        // bir islemde, "herhangi bir PM" yerine "bu projenin sahibi" kisitini koruyoruz.)
        var isOwner = project.OwnerId == _currentUser.UserId;
        if (!_currentUser.IsAdmin && !isOwner)
            throw new UnauthorizedAccessException("Bu projeyi silme yetkiniz yok. Yalnızca System Admin ya da projenin sahibi olan Project Manager silebilir.");

        var taskIds = await _db.Tasks.IgnoreQueryFilters().Where(t => t.ProjectId == project.Id).Select(t => t.Id).ToListAsync(ct);

        // #5: dosyalar once silinir -- DB kaydi silindikten sonra fiziksel dosyaya referans kaybolur.
        var attachments = await _db.Attachments.IgnoreQueryFilters().Where(a => taskIds.Contains(a.TaskId)).ToListAsync(ct);
        foreach (var attachment in attachments)
        {
            try { _fileStorage.Delete(attachment.FilePath); }
            catch { /* fiziksel dosya zaten yoksa islemi durdurma, DB temizligine devam et */ }
        }

        // #5: FK'lar cogu yerde Cascade/Restrict karisik tanimli oldugu icin, guvenli sirayla
        // (yapraklardan koke dogru) manuel siliyoruz -- tek bir transaction icinde, hepsi ya
        // basarili olur ya da hicbiri (kismi silme birakilmaz).
        await using var transaction = await ((DbContext)_db).Database.BeginTransactionAsync(ct);
        try
        {
            _db.Attachments.RemoveRange(attachments);
            _db.TaskCustomFieldValues.RemoveRange(_db.TaskCustomFieldValues.Where(v => taskIds.Contains(v.TaskId)));
            _db.TaskComponents.RemoveRange(_db.TaskComponents.Where(tc => taskIds.Contains(tc.TaskId)));
            _db.TaskLabels.RemoveRange(_db.TaskLabels.Where(tl => taskIds.Contains(tl.TaskId)));
            _db.TaskLinks.RemoveRange(_db.TaskLinks.Where(l => taskIds.Contains(l.SourceTaskId) || taskIds.Contains(l.TargetTaskId)));
            _db.ChecklistItems.RemoveRange(_db.ChecklistItems.Where(c => taskIds.Contains(c.TaskId)));
            _db.WorkLogs.RemoveRange(_db.WorkLogs.Where(w => taskIds.Contains(w.TaskId)));
            _db.Watchers.RemoveRange(_db.Watchers.Where(w => taskIds.Contains(w.TaskId)));
            _db.Comments.RemoveRange(_db.Comments.IgnoreQueryFilters().Where(c => taskIds.Contains(c.TaskId)));
            await _db.SaveChangesAsync(ct);

            _db.RetrospectiveNotes.RemoveRange(_db.RetrospectiveNotes.Where(n => _db.Sprints.Any(s => s.Id == n.SprintId && s.ProjectId == project.Id)));
            _db.SprintBurndownSnapshots.RemoveRange(_db.SprintBurndownSnapshots.Where(sn => _db.Sprints.Any(s => s.Id == sn.SprintId && s.ProjectId == project.Id)));
            await _db.SaveChangesAsync(ct);

            _db.Tasks.RemoveRange(_db.Tasks.IgnoreQueryFilters().Where(t => t.ProjectId == project.Id));
            await _db.SaveChangesAsync(ct);

            _db.Sprints.RemoveRange(_db.Sprints.Where(s => s.ProjectId == project.Id));
            _db.Releases.RemoveRange(_db.Releases.Where(r => r.ProjectId == project.Id));
            await _db.SaveChangesAsync(ct);

            _db.WorkflowTransitions.RemoveRange(_db.WorkflowTransitions.Where(t => t.ProjectId == project.Id));
            _db.ProjectWorkflowStatuses.RemoveRange(_db.ProjectWorkflowStatuses.Where(s => s.ProjectId == project.Id));
            _db.BoardColumnSettings.RemoveRange(_db.BoardColumnSettings.Where(s => s.ProjectId == project.Id));
            _db.BoardColumns.RemoveRange(_db.BoardColumns.Where(c => c.ProjectId == project.Id));
            _db.CustomFieldDefinitions.RemoveRange(_db.CustomFieldDefinitions.Where(f => f.ProjectId == project.Id));
            _db.ProjectComponents.RemoveRange(_db.ProjectComponents.Where(c => c.ProjectId == project.Id));
            _db.ProjectIssueTypeAssignments.RemoveRange(_db.ProjectIssueTypeAssignments.Where(a => a.ProjectId == project.Id));
            _db.AutomationRules.RemoveRange(_db.AutomationRules.Where(r => r.ProjectId == project.Id));
            _db.ProjectPermissionOverrides.RemoveRange(_db.ProjectPermissionOverrides.Where(o => o.ProjectId == project.Id));
            _db.SavedFilters.RemoveRange(_db.SavedFilters.Where(f => f.ProjectId == project.Id));
            await _db.SaveChangesAsync(ct);

            _db.ProjectMembers.RemoveRange(_db.ProjectMembers.Where(m => m.ProjectId == project.Id));
            _db.ProjectTeams.RemoveRange(_db.ProjectTeams.Where(pt => pt.ProjectId == project.Id));
            await _db.SaveChangesAsync(ct);

            _db.Projects.Remove(project);
            await _db.SaveChangesAsync(ct);

            await transaction.CommitAsync(ct);
        }
        catch
        {
            await transaction.RollbackAsync(ct);
            throw; // #5: hicbir asamada kismi silinmis proje birakilmaz -- hata olursa tum islem geri alinir.
        }
    }
}