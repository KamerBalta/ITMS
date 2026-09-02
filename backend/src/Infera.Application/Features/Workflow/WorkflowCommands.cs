using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Workflow;

public record GetWorkflowTransitionsQuery(Guid ProjectId, bool IncludeDraft) : IRequest<List<WorkflowTransitionDto>>;
public record CreateWorkflowTransitionCommand(Guid ProjectId, Guid FromStatusId, Guid ToStatusId, List<string> AllowedRoles, bool RequireAssigneeSelf) : IRequest<Guid>;
public record UpdateWorkflowTransitionCommand(Guid Id, List<string> AllowedRoles, bool RequireAssigneeSelf) : IRequest;
public record DeleteWorkflowTransitionCommand(Guid Id) : IRequest;
public record PublishWorkflowCommand(Guid ProjectId) : IRequest;
public record HasUnpublishedChangesQuery(Guid ProjectId) : IRequest<bool>;

public record WorkflowTransitionDto(Guid Id, Guid FromStatusId, string FromStatusName, Guid ToStatusId, string ToStatusName, List<string> AllowedRoles, bool RequireAssigneeSelf, bool IsDraft);

public class GetWorkflowTransitionsQueryHandler : IRequestHandler<GetWorkflowTransitionsQuery, List<WorkflowTransitionDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetWorkflowTransitionsQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<List<WorkflowTransitionDto>> Handle(GetWorkflowTransitionsQuery request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        var query = _db.WorkflowTransitions.Where(t => t.ProjectId == request.ProjectId);
        if (!request.IncludeDraft) query = query.Where(t => !t.IsDraft);

        return await query
            .OrderBy(t => t.FromStatus.DisplayOrder)
            .Select(t => new WorkflowTransitionDto(
                t.Id, t.FromStatusId, t.FromStatus.Name, t.ToStatusId, t.ToStatus.Name,
                t.AllowedRoles.Split(',', StringSplitOptions.None).ToList(), t.RequireAssigneeSelf, t.IsDraft))
            .ToListAsync(ct);
    }
}

public class CreateWorkflowTransitionCommandHandler : IRequestHandler<CreateWorkflowTransitionCommand, Guid>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;

    public CreateWorkflowTransitionCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth)
    {
        _db = db;
        _projectAuth = projectAuth;
    }

    public async System.Threading.Tasks.Task<Guid> Handle(CreateWorkflowTransitionCommand request, CancellationToken ct)
    {
        await _projectAuth.EnsureProjectManagerOrAdminAsync(request.ProjectId, ct);

        if (request.FromStatusId == request.ToStatusId)
            throw new InvalidOperationException("Başlangıç ve hedef durum aynı olamaz.");
        if (request.AllowedRoles.Count == 0)
            throw new InvalidOperationException("En az bir rol seçilmelidir.");

        var statusesExist = await _db.ProjectWorkflowStatuses
            .CountAsync(s => s.ProjectId == request.ProjectId && (s.Id == request.FromStatusId || s.Id == request.ToStatusId), ct);
        if (statusesExist != 2) throw new KeyNotFoundException("Belirtilen durumlardan biri bu projede bulunamadı.");

        var exists = await _db.WorkflowTransitions
            .AnyAsync(t => t.ProjectId == request.ProjectId && t.FromStatusId == request.FromStatusId && t.ToStatusId == request.ToStatusId, ct);
        if (exists) throw new InvalidOperationException("Bu geçiş zaten tanımlı, düzenlemek için mevcut kaydı güncelleyin.");

        var entity = new WorkflowTransition
        {
            ProjectId = request.ProjectId,
            FromStatusId = request.FromStatusId,
            ToStatusId = request.ToStatusId,
            AllowedRoles = string.Join(",", request.AllowedRoles),
            RequireAssigneeSelf = request.RequireAssigneeSelf,
            IsDraft = true, // #Madde-4: yeni gecis de taslak olarak baslar
        };
        _db.WorkflowTransitions.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity.Id;
    }
}

public class UpdateWorkflowTransitionCommandHandler : IRequestHandler<UpdateWorkflowTransitionCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;

    public UpdateWorkflowTransitionCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth)
    {
        _db = db;
        _projectAuth = projectAuth;
    }

    public async System.Threading.Tasks.Task Handle(UpdateWorkflowTransitionCommand request, CancellationToken ct)
    {
        var entity = await _db.WorkflowTransitions.FirstOrDefaultAsync(t => t.Id == request.Id, ct) ?? throw new KeyNotFoundException("Geçiş kuralı bulunamadı.");
        await _projectAuth.EnsureProjectManagerOrAdminAsync(entity.ProjectId, ct);

        if (request.AllowedRoles.Count == 0) throw new InvalidOperationException("En az bir rol seçilmelidir.");

        entity.AllowedRoles = string.Join(",", request.AllowedRoles);
        entity.RequireAssigneeSelf = request.RequireAssigneeSelf;
        entity.IsDraft = true; // #Madde-4: mevcut bir geciste degisiklik yapmak da yeniden yayinlamayi gerektirir
        await _db.SaveChangesAsync(ct);
    }
}

public class DeleteWorkflowTransitionCommandHandler : IRequestHandler<DeleteWorkflowTransitionCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;

    public DeleteWorkflowTransitionCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth)
    {
        _db = db;
        _projectAuth = projectAuth;
    }

    public async System.Threading.Tasks.Task Handle(DeleteWorkflowTransitionCommand request, CancellationToken ct)
    {
        var entity = await _db.WorkflowTransitions.FirstOrDefaultAsync(t => t.Id == request.Id, ct) ?? throw new KeyNotFoundException("Geçiş kuralı bulunamadı.");
        await _projectAuth.EnsureProjectManagerOrAdminAsync(entity.ProjectId, ct);

        _db.WorkflowTransitions.Remove(entity);
        await _db.SaveChangesAsync(ct);
    }
}

public class PublishWorkflowCommandHandler : IRequestHandler<PublishWorkflowCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;
    private readonly IRealtimeNotifier _realtime;

    public PublishWorkflowCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth, IRealtimeNotifier realtime)
    {
        _db = db;
        _projectAuth = projectAuth;
        _realtime = realtime;
    }

    public async System.Threading.Tasks.Task Handle(PublishWorkflowCommand request, CancellationToken ct)
    {
        await _projectAuth.EnsureProjectManagerOrAdminAsync(request.ProjectId, ct);

        var draftStatuses = await _db.ProjectWorkflowStatuses.Where(s => s.ProjectId == request.ProjectId && s.IsDraft).ToListAsync(ct);
        var draftTransitions = await _db.WorkflowTransitions.Where(t => t.ProjectId == request.ProjectId && t.IsDraft).ToListAsync(ct);

        foreach (var s in draftStatuses) s.IsDraft = false;
        foreach (var t in draftTransitions) t.IsDraft = false;

        await _db.SaveChangesAsync(ct);

        // Board'a bakan herkese "workflow degisti" sinyali -- kolonlar yeniden cekilmeli.
        await _realtime.NotifyProjectAsync(request.ProjectId, "workflow", "published", ct);
    }
}

public class HasUnpublishedChangesQueryHandler : IRequestHandler<HasUnpublishedChangesQuery, bool>
{
    private readonly IAppDbContext _db;
    public HasUnpublishedChangesQueryHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<bool> Handle(HasUnpublishedChangesQuery request, CancellationToken ct)
    {
        var hasDraftStatus = await _db.ProjectWorkflowStatuses.AnyAsync(s => s.ProjectId == request.ProjectId && s.IsDraft, ct);
        var hasDraftTransition = await _db.WorkflowTransitions.AnyAsync(t => t.ProjectId == request.ProjectId && t.IsDraft, ct);
        return hasDraftStatus || hasDraftTransition;
    }
}