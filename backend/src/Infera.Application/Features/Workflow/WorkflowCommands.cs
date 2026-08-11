using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Workflow;

public record GetWorkflowTransitionsQuery(Guid ProjectId) : IRequest<List<WorkflowTransitionDto>>;
public record CreateWorkflowTransitionCommand(Guid ProjectId, string FromStatus, string ToStatus, List<string> AllowedRoles, bool RequireAssigneeSelf) : IRequest<Guid>;
public record UpdateWorkflowTransitionCommand(Guid Id, List<string> AllowedRoles, bool RequireAssigneeSelf) : IRequest;
public record DeleteWorkflowTransitionCommand(Guid Id) : IRequest;

public record WorkflowTransitionDto(Guid Id, string FromStatus, string ToStatus, List<string> AllowedRoles, bool RequireAssigneeSelf);

file static class WorkflowAuthorization
{
    public static async System.Threading.Tasks.Task EnsureCanManageAsync(
        IAppDbContext db, ICurrentUserService currentUser, Guid projectId, CancellationToken ct)
    {
        if (currentUser.IsAdmin) return;

        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == projectId, ct)
            ?? throw new KeyNotFoundException("Proje bulunamadı.");

        if (project.OwnerId != currentUser.UserId)
            throw new UnauthorizedAccessException("Bu projede workflow yönetimi yapma yetkiniz yok.");
    }
}

public class GetWorkflowTransitionsQueryHandler : IRequestHandler<GetWorkflowTransitionsQuery, List<WorkflowTransitionDto>>
{
    private readonly IAppDbContext _db;
    public GetWorkflowTransitionsQueryHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<List<WorkflowTransitionDto>> Handle(GetWorkflowTransitionsQuery request, CancellationToken ct)
    {
        return await _db.WorkflowTransitions
            .Where(t => t.ProjectId == request.ProjectId)
            .OrderBy(t => t.FromStatus).ThenBy(t => t.ToStatus)
            .Select(t => new WorkflowTransitionDto(
                t.Id, t.FromStatus, t.ToStatus,
                t.AllowedRoles.Split(',', StringSplitOptions.None).ToList(),
                t.RequireAssigneeSelf))
            .ToListAsync(ct);
    }
}

public class CreateWorkflowTransitionCommandHandler : IRequestHandler<CreateWorkflowTransitionCommand, Guid>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public CreateWorkflowTransitionCommandHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task<Guid> Handle(CreateWorkflowTransitionCommand request, CancellationToken ct)
    {
        await WorkflowAuthorization.EnsureCanManageAsync(_db, _currentUser, request.ProjectId, ct);

        if (request.FromStatus == request.ToStatus)
            throw new InvalidOperationException("Başlangıç ve hedef durum aynı olamaz.");

        if (request.AllowedRoles.Count == 0)
            throw new InvalidOperationException("En az bir rol seçilmelidir.");

        var exists = await _db.WorkflowTransitions
            .AnyAsync(t => t.ProjectId == request.ProjectId && t.FromStatus == request.FromStatus && t.ToStatus == request.ToStatus, ct);
        if (exists)
            throw new InvalidOperationException("Bu geçiş zaten tanımlı, düzenlemek için mevcut kaydı güncelleyin.");

        var entity = new WorkflowTransition
        {
            ProjectId = request.ProjectId,
            FromStatus = request.FromStatus,
            ToStatus = request.ToStatus,
            AllowedRoles = string.Join(",", request.AllowedRoles),
            RequireAssigneeSelf = request.RequireAssigneeSelf,
        };
        _db.WorkflowTransitions.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity.Id;
    }
}

public class UpdateWorkflowTransitionCommandHandler : IRequestHandler<UpdateWorkflowTransitionCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public UpdateWorkflowTransitionCommandHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task Handle(UpdateWorkflowTransitionCommand request, CancellationToken ct)
    {
        var entity = await _db.WorkflowTransitions.FirstOrDefaultAsync(t => t.Id == request.Id, ct)
            ?? throw new KeyNotFoundException("Geçiş kuralı bulunamadı.");

        await WorkflowAuthorization.EnsureCanManageAsync(_db, _currentUser, entity.ProjectId, ct);

        if (request.AllowedRoles.Count == 0)
            throw new InvalidOperationException("En az bir rol seçilmelidir.");

        entity.AllowedRoles = string.Join(",", request.AllowedRoles);
        entity.RequireAssigneeSelf = request.RequireAssigneeSelf;
        await _db.SaveChangesAsync(ct);
    }
}

public class DeleteWorkflowTransitionCommandHandler : IRequestHandler<DeleteWorkflowTransitionCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public DeleteWorkflowTransitionCommandHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task Handle(DeleteWorkflowTransitionCommand request, CancellationToken ct)
    {
        var entity = await _db.WorkflowTransitions.FirstOrDefaultAsync(t => t.Id == request.Id, ct)
            ?? throw new KeyNotFoundException("Geçiş kuralı bulunamadı.");

        await WorkflowAuthorization.EnsureCanManageAsync(_db, _currentUser, entity.ProjectId, ct);

        _db.WorkflowTransitions.Remove(entity);
        await _db.SaveChangesAsync(ct);
    }
}