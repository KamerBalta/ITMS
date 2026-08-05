using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.ProjectIssueTypes;

public record AssignIssueTypeToProjectCommand(Guid ProjectId, Guid IssueTypeId) : IRequest<Guid>;
public record RemoveIssueTypeFromProjectCommand(Guid ProjectId, Guid IssueTypeId) : IRequest;
public record ReorderProjectIssueTypesCommand(Guid ProjectId, List<Guid> OrderedIssueTypeIds) : IRequest;
public record GetProjectIssueTypesQuery(Guid ProjectId) : IRequest<List<ProjectIssueTypeDto>>;

public record ProjectIssueTypeDto(
    Guid IssueTypeId, string Name, string? Description, string? Icon, string? Color,
    int CreatorTier, bool AllowsChildren, bool RequiresParent, bool IsSystemDefault, bool IsActive, int DisplayOrder);

file static class ProjectIssueTypeAuthorization
{
    // Admin her projede, PM yalnizca kendi (Owner oldugu) projesinde yonetebilir.
    public static async System.Threading.Tasks.Task EnsureCanManageAsync(
        IAppDbContext db, ICurrentUserService currentUser, Guid projectId, CancellationToken ct)
    {
        if (currentUser.IsAdmin) return;

        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == projectId, ct)
            ?? throw new KeyNotFoundException("Proje bulunamadı.");

        if (project.OwnerId != currentUser.UserId)
            throw new UnauthorizedAccessException("Bu projede Issue Type yönetimi yapma yetkiniz yok.");
    }
}

public static class DefaultProjectIssueTypeSeeder
{
    // Proje olusturulunca global sistem varsayilanlarini (Epic/Story/Task/Bug) otomatik atar.
    public static async System.Threading.Tasks.Task AssignDefaultsAsync(IAppDbContext db, Guid projectId, CancellationToken ct)
    {
        var defaults = await db.IssueTypes.Where(t => t.IsSystemDefault).ToListAsync(ct);
        for (int i = 0; i < defaults.Count; i++)
        {
            db.ProjectIssueTypeAssignments.Add(new ProjectIssueTypeAssignment
            {
                ProjectId = projectId,
                IssueTypeId = defaults[i].Id,
                DisplayOrder = i,
            });
        }
    }
}

public class AssignIssueTypeToProjectCommandHandler : IRequestHandler<AssignIssueTypeToProjectCommand, Guid>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public AssignIssueTypeToProjectCommandHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task<Guid> Handle(AssignIssueTypeToProjectCommand request, CancellationToken ct)
    {
        await ProjectIssueTypeAuthorization.EnsureCanManageAsync(_db, _currentUser, request.ProjectId, ct);

        var issueType = await _db.IssueTypes.FirstOrDefaultAsync(t => t.Id == request.IssueTypeId, ct)
            ?? throw new KeyNotFoundException("Issue type bulunamadı.");

        if (!issueType.IsActive)
            throw new InvalidOperationException("Pasif durumdaki bir issue type projeye atanamaz.");

        var alreadyAssigned = await _db.ProjectIssueTypeAssignments
            .AnyAsync(a => a.ProjectId == request.ProjectId && a.IssueTypeId == request.IssueTypeId, ct);
        if (alreadyAssigned)
            throw new InvalidOperationException("Bu issue type zaten bu projeye atanmış.");

        var maxOrder = await _db.ProjectIssueTypeAssignments
            .Where(a => a.ProjectId == request.ProjectId)
            .Select(a => (int?)a.DisplayOrder)
            .MaxAsync(ct) ?? -1;

        var assignment = new ProjectIssueTypeAssignment
        {
            ProjectId = request.ProjectId,
            IssueTypeId = request.IssueTypeId,
            DisplayOrder = maxOrder + 1,
        };
        _db.ProjectIssueTypeAssignments.Add(assignment);
        await _db.SaveChangesAsync(ct);
        return assignment.Id;
    }
}

public class RemoveIssueTypeFromProjectCommandHandler : IRequestHandler<RemoveIssueTypeFromProjectCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public RemoveIssueTypeFromProjectCommandHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task Handle(RemoveIssueTypeFromProjectCommand request, CancellationToken ct)
    {
        await ProjectIssueTypeAuthorization.EnsureCanManageAsync(_db, _currentUser, request.ProjectId, ct);

        var assignment = await _db.ProjectIssueTypeAssignments
            .Include(a => a.IssueType)
            .FirstOrDefaultAsync(a => a.ProjectId == request.ProjectId && a.IssueTypeId == request.IssueTypeId, ct)
            ?? throw new KeyNotFoundException("Bu issue type zaten bu projeye atanmamış.");

        if (assignment.IssueType.IsSystemDefault)
            throw new InvalidOperationException("Sistem varsayılanı olan issue type'lar bir projeden kaldırılamaz.");

        var usedInProject = await _db.Tasks
            .AnyAsync(t => t.ProjectId == request.ProjectId && t.IssueTypeId == request.IssueTypeId, ct);
        if (usedInProject)
            throw new InvalidOperationException("Bu tip bu projede en az bir görev tarafından kullanılıyor, kaldırılamaz.");

        _db.ProjectIssueTypeAssignments.Remove(assignment);
        await _db.SaveChangesAsync(ct);
    }
}

public class ReorderProjectIssueTypesCommandHandler : IRequestHandler<ReorderProjectIssueTypesCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public ReorderProjectIssueTypesCommandHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task Handle(ReorderProjectIssueTypesCommand request, CancellationToken ct)
    {
        await ProjectIssueTypeAuthorization.EnsureCanManageAsync(_db, _currentUser, request.ProjectId, ct);

        var assignments = await _db.ProjectIssueTypeAssignments
            .Where(a => a.ProjectId == request.ProjectId)
            .ToListAsync(ct);

        if (assignments.Count != request.OrderedIssueTypeIds.Count ||
            assignments.Select(a => a.IssueTypeId).Except(request.OrderedIssueTypeIds).Any())
            throw new InvalidOperationException("Sıralama listesi bu projenin tüm issue type'larını içermelidir.");

        for (int i = 0; i < request.OrderedIssueTypeIds.Count; i++)
        {
            var assignment = assignments.First(a => a.IssueTypeId == request.OrderedIssueTypeIds[i]);
            assignment.DisplayOrder = i;
        }

        await _db.SaveChangesAsync(ct);
    }
}

public class GetProjectIssueTypesQueryHandler : IRequestHandler<GetProjectIssueTypesQuery, List<ProjectIssueTypeDto>>
{
    private readonly IAppDbContext _db;
    public GetProjectIssueTypesQueryHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<List<ProjectIssueTypeDto>> Handle(GetProjectIssueTypesQuery request, CancellationToken ct)
    {
        return await _db.ProjectIssueTypeAssignments
            .Where(a => a.ProjectId == request.ProjectId)
            .OrderBy(a => a.DisplayOrder)
            .Select(a => new ProjectIssueTypeDto(
                a.IssueTypeId, a.IssueType.Name, a.IssueType.Description, a.IssueType.Icon, a.IssueType.Color,
                a.IssueType.CreatorTier, a.IssueType.AllowsChildren, a.IssueType.RequiresParent,
                a.IssueType.IsSystemDefault, a.IssueType.IsActive, a.DisplayOrder))
            .ToListAsync(ct);
    }
}