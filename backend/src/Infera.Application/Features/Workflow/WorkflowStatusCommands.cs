using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Workflow;

public record CreateWorkflowStatusCommand(Guid ProjectId, string Name, string Category, string? Color) : IRequest<Guid>;
public record UpdateWorkflowStatusCommand(Guid Id, string Name, string Category, string? Color) : IRequest;
public record DeleteWorkflowStatusCommand(Guid Id) : IRequest;
public record ReorderWorkflowStatusesCommand(Guid ProjectId, List<Guid> OrderedIds) : IRequest;
public record SetInitialStatusCommand(Guid ProjectId, Guid StatusId) : IRequest;
public record SetEpicCloseTargetCommand(Guid ProjectId, Guid StatusId) : IRequest;
public record GetWorkflowStatusesQuery(Guid ProjectId, bool IncludeDraft) : IRequest<List<WorkflowStatusDto>>;

public record WorkflowStatusDto(
    Guid Id,
    string Name,
    string Category,
    string? Color,
    int DisplayOrder,
    bool IsInitial,
    bool IsEpicCloseTarget,
    bool IsDraft,
    Guid? BoardColumnId);

public class CreateWorkflowStatusCommandHandler : IRequestHandler<CreateWorkflowStatusCommand, Guid>
{
    private static readonly string[] ValidCategories = { "ToDo", "InProgress", "Done" };
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;

    public CreateWorkflowStatusCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth)
    {
        _db = db;
        _projectAuth = projectAuth;
    }

    public async System.Threading.Tasks.Task<Guid> Handle(CreateWorkflowStatusCommand request, CancellationToken ct)
    {
        await _projectAuth.EnsureProjectManagerOrAdminAsync(request.ProjectId, ct);

        if (!ValidCategories.Contains(request.Category))
            throw new InvalidOperationException("Geçersiz kategori. ToDo, InProgress veya Done olmalıdır.");

        var exists = await _db.ProjectWorkflowStatuses.AnyAsync(s => s.ProjectId == request.ProjectId && s.Name == request.Name, ct);
        if (exists) throw new InvalidOperationException("Bu isimde bir durum zaten var.");

        var maxOrder = await _db.ProjectWorkflowStatuses.Where(s => s.ProjectId == request.ProjectId).Select(s => (int?)s.DisplayOrder).MaxAsync(ct) ?? -1;

        // #Madde-4: yeni durum TASLAK olarak eklenir -- Yayınla'ya basılana kadar Board/geçişlerde görünmez.
        var entity = new ProjectWorkflowStatus
        {
            ProjectId = request.ProjectId,
            Name = request.Name,
            Category = request.Category,
            Color = request.Color,
            DisplayOrder = maxOrder + 1,
            IsDraft = true,
        };
        _db.ProjectWorkflowStatuses.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity.Id;
    }
}

public class UpdateWorkflowStatusCommandHandler : IRequestHandler<UpdateWorkflowStatusCommand>
{
    private static readonly string[] ValidCategories = { "ToDo", "InProgress", "Done" };
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;

    public UpdateWorkflowStatusCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth)
    {
        _db = db;
        _projectAuth = projectAuth;
    }

    public async System.Threading.Tasks.Task Handle(UpdateWorkflowStatusCommand request, CancellationToken ct)
    {
        var entity = await _db.ProjectWorkflowStatuses.FirstOrDefaultAsync(s => s.Id == request.Id, ct) ?? throw new KeyNotFoundException("Durum bulunamadı.");
        await _projectAuth.EnsureProjectManagerOrAdminAsync(entity.ProjectId, ct);

        if (!ValidCategories.Contains(request.Category))
            throw new InvalidOperationException("Geçersiz kategori.");

        var nameConflict = await _db.ProjectWorkflowStatuses.AnyAsync(s => s.ProjectId == entity.ProjectId && s.Name == request.Name && s.Id != request.Id, ct);
        if (nameConflict) throw new InvalidOperationException("Bu isimde başka bir durum zaten var.");

        entity.Name = request.Name;
        entity.Category = request.Category;
        entity.Color = request.Color;
        // Rename/kategori değişikliği mevcut görevleri hemen etkiler (bu bir "Publish" gerektiren
        // yapısal değişiklik değil, sadece etiket güncellemesi) -- IsDraft'a dokunmuyoruz.
        await _db.SaveChangesAsync(ct);
    }
}

public class DeleteWorkflowStatusCommandHandler : IRequestHandler<DeleteWorkflowStatusCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;

    public DeleteWorkflowStatusCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth)
    {
        _db = db;
        _projectAuth = projectAuth;
    }

    public async System.Threading.Tasks.Task Handle(DeleteWorkflowStatusCommand request, CancellationToken ct)
    {
        var entity = await _db.ProjectWorkflowStatuses.FirstOrDefaultAsync(s => s.Id == request.Id, ct) ?? throw new KeyNotFoundException("Durum bulunamadı.");
        await _projectAuth.EnsureProjectManagerOrAdminAsync(entity.ProjectId, ct);

        var inUse = await _db.Tasks.AnyAsync(t => t.StatusId == request.Id, ct);
        if (inUse) throw new InvalidOperationException("Bu durumda en az bir görev var, silinemez. Önce görevleri başka bir duruma taşıyın.");

        if (entity.IsInitial) throw new InvalidOperationException("Başlangıç durumu silinemez. Önce başka bir durumu başlangıç yapın.");

        var usedInTransitions = await _db.WorkflowTransitions.AnyAsync(t => t.FromStatusId == request.Id || t.ToStatusId == request.Id, ct);
        if (usedInTransitions) throw new InvalidOperationException("Bu durum, en az bir geçiş kuralında kullanılıyor. Önce ilgili geçişleri silin.");

        _db.ProjectWorkflowStatuses.Remove(entity);
        await _db.SaveChangesAsync(ct);
    }
}

public class ReorderWorkflowStatusesCommandHandler : IRequestHandler<ReorderWorkflowStatusesCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;

    public ReorderWorkflowStatusesCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth)
    {
        _db = db;
        _projectAuth = projectAuth;
    }

    public async System.Threading.Tasks.Task Handle(ReorderWorkflowStatusesCommand request, CancellationToken ct)
    {
        await _projectAuth.EnsureProjectManagerOrAdminAsync(request.ProjectId, ct);

        var statuses = await _db.ProjectWorkflowStatuses.Where(s => s.ProjectId == request.ProjectId).ToListAsync(ct);
        if (statuses.Count != request.OrderedIds.Count || statuses.Select(s => s.Id).Except(request.OrderedIds).Any())
            throw new InvalidOperationException("Sıralama listesi bu projenin tüm durumlarını içermelidir.");

        for (int i = 0; i < request.OrderedIds.Count; i++)
            statuses.First(s => s.Id == request.OrderedIds[i]).DisplayOrder = i;

        await _db.SaveChangesAsync(ct);
    }
}

public class SetInitialStatusCommandHandler : IRequestHandler<SetInitialStatusCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;

    public SetInitialStatusCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth)
    {
        _db = db;
        _projectAuth = projectAuth;
    }

    public async System.Threading.Tasks.Task Handle(SetInitialStatusCommand request, CancellationToken ct)
    {
        await _projectAuth.EnsureProjectManagerOrAdminAsync(request.ProjectId, ct);

        var statuses = await _db.ProjectWorkflowStatuses.Where(s => s.ProjectId == request.ProjectId).ToListAsync(ct);
        var target = statuses.FirstOrDefault(s => s.Id == request.StatusId) ?? throw new KeyNotFoundException("Durum bulunamadı.");

        foreach (var s in statuses) s.IsInitial = false;
        target.IsInitial = true;
        await _db.SaveChangesAsync(ct);
    }
}

public class SetEpicCloseTargetCommandHandler : IRequestHandler<SetEpicCloseTargetCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;

    public SetEpicCloseTargetCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth)
    {
        _db = db;
        _projectAuth = projectAuth;
    }

    public async System.Threading.Tasks.Task Handle(SetEpicCloseTargetCommand request, CancellationToken ct)
    {
        await _projectAuth.EnsureProjectManagerOrAdminAsync(request.ProjectId, ct);

        var statuses = await _db.ProjectWorkflowStatuses.Where(s => s.ProjectId == request.ProjectId).ToListAsync(ct);
        var target = statuses.FirstOrDefault(s => s.Id == request.StatusId) ?? throw new KeyNotFoundException("Durum bulunamadı.");

        if (target.Category != "Done")
            throw new InvalidOperationException("Epic kapatma hedefi yalnızca 'Done' kategorisindeki bir durum olabilir.");

        foreach (var s in statuses) s.IsEpicCloseTarget = false;
        target.IsEpicCloseTarget = true;
        await _db.SaveChangesAsync(ct);
    }
}

public class GetWorkflowStatusesQueryHandler : IRequestHandler<GetWorkflowStatusesQuery, List<WorkflowStatusDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetWorkflowStatusesQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<List<WorkflowStatusDto>> Handle(GetWorkflowStatusesQuery request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        var query = _db.ProjectWorkflowStatuses.Where(s => s.ProjectId == request.ProjectId);
        if (!request.IncludeDraft) query = query.Where(s => !s.IsDraft);

        return await query
            .OrderBy(s => s.DisplayOrder)
            .Select(s => new WorkflowStatusDto(
                s.Id,
                s.Name,
                s.Category,
                s.Color,
                s.DisplayOrder,
                s.IsInitial,
                s.IsEpicCloseTarget,
                s.IsDraft,
                s.BoardColumnId))
            .ToListAsync(ct);
    }
}