using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.IssueTypes;

public record CreateIssueTypeCommand(
    string Name, string? Description, string? Icon, string? Color,
    int CreatorTier, bool AllowsChildren, bool RequiresParent) : IRequest<Guid>;

public record UpdateIssueTypeCommand(
    Guid Id, string Name, string? Description, string? Icon, string? Color,
    int CreatorTier, bool AllowsChildren, bool RequiresParent) : IRequest;

public record ToggleIssueTypeActiveCommand(Guid Id) : IRequest;
public record DeleteIssueTypeCommand(Guid Id) : IRequest;
public record GetIssueTypesQuery(bool ActiveOnly = false) : IRequest<List<IssueTypeDto>>;

public record IssueTypeDto(
    Guid Id, string Name, string? Description, string? Icon, string? Color,
    int CreatorTier, bool AllowsChildren, bool RequiresParent, bool IsSystemDefault, bool IsActive);

public class CreateIssueTypeCommandHandler : IRequestHandler<CreateIssueTypeCommand, Guid>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public CreateIssueTypeCommandHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task<Guid> Handle(CreateIssueTypeCommand request, CancellationToken ct)
    {
        if (!_currentUser.IsAdmin)
            throw new UnauthorizedAccessException("Global Issue Type oluşturma yetkiniz yok. Yalnızca System Admin oluşturabilir.");

        if (request.RequiresParent && request.AllowsChildren)
            throw new InvalidOperationException("Bir tip aynı anda hem üst görev hem alt görev davranışına sahip olamaz.");

        var exists = await _db.IssueTypes.AnyAsync(t => t.Name == request.Name, ct);
        if (exists)
            throw new InvalidOperationException("Bu isimde bir issue type zaten mevcut.");

        var entity = new IssueType
        {
            Name = request.Name,
            Description = request.Description,
            Icon = request.Icon,
            Color = request.Color,
            CreatorTier = request.CreatorTier,
            AllowsChildren = request.AllowsChildren,
            RequiresParent = request.RequiresParent,
            IsSystemDefault = false,
        };
        _db.IssueTypes.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity.Id;
    }
}

public class UpdateIssueTypeCommandHandler : IRequestHandler<UpdateIssueTypeCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public UpdateIssueTypeCommandHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task Handle(UpdateIssueTypeCommand request, CancellationToken ct)
    {
        if (!_currentUser.IsAdmin)
            throw new UnauthorizedAccessException("Global Issue Type düzenleme yetkiniz yok.");

        var entity = await _db.IssueTypes.FirstOrDefaultAsync(t => t.Id == request.Id, ct)
            ?? throw new KeyNotFoundException("Issue type bulunamadı.");

        if (request.RequiresParent && request.AllowsChildren)
            throw new InvalidOperationException("Bir tip aynı anda hem üst görev hem alt görev davranışına sahip olamaz.");

        var nameConflict = await _db.IssueTypes.AnyAsync(t => t.Name == request.Name && t.Id != request.Id, ct);
        if (nameConflict)
            throw new InvalidOperationException("Bu isimde başka bir issue type zaten mevcut.");

        entity.Name = request.Name;
        entity.Description = request.Description;
        entity.Icon = request.Icon;
        entity.Color = request.Color;
        entity.CreatorTier = request.CreatorTier;
        entity.AllowsChildren = request.AllowsChildren;
        entity.RequiresParent = request.RequiresParent;

        await _db.SaveChangesAsync(ct);
    }
}

public class ToggleIssueTypeActiveCommandHandler : IRequestHandler<ToggleIssueTypeActiveCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public ToggleIssueTypeActiveCommandHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task Handle(ToggleIssueTypeActiveCommand request, CancellationToken ct)
    {
        if (!_currentUser.IsAdmin)
            throw new UnauthorizedAccessException("Yetkiniz yok.");

        var entity = await _db.IssueTypes.FirstOrDefaultAsync(t => t.Id == request.Id, ct)
            ?? throw new KeyNotFoundException("Issue type bulunamadı.");

        entity.IsActive = !entity.IsActive;
        await _db.SaveChangesAsync(ct);
    }
}

public class DeleteIssueTypeCommandHandler : IRequestHandler<DeleteIssueTypeCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public DeleteIssueTypeCommandHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task Handle(DeleteIssueTypeCommand request, CancellationToken ct)
    {
        if (!_currentUser.IsAdmin)
            throw new UnauthorizedAccessException("Yetkiniz yok.");

        var entity = await _db.IssueTypes.FirstOrDefaultAsync(t => t.Id == request.Id, ct)
            ?? throw new KeyNotFoundException("Issue type bulunamadı.");

        if (entity.IsSystemDefault)
            throw new InvalidOperationException("Sistem varsayılanı olan issue type'lar silinemez, yalnızca pasif hale getirilebilir.");

        var usedByTask = await _db.Tasks.AnyAsync(t => t.IssueTypeId == request.Id, ct);
        if (usedByTask)
            throw new InvalidOperationException("Bu tip en az bir görev tarafından kullanılıyor, silinemez.");

        var assignedToProject = await _db.ProjectIssueTypeAssignments.AnyAsync(a => a.IssueTypeId == request.Id, ct);
        if (assignedToProject)
            throw new InvalidOperationException("Bu tip en az bir projeye atanmış, önce projelerden kaldırın.");

        _db.IssueTypes.Remove(entity);
        await _db.SaveChangesAsync(ct);
    }
}

public class GetIssueTypesQueryHandler : IRequestHandler<GetIssueTypesQuery, List<IssueTypeDto>>
{
    private readonly IAppDbContext _db;
    public GetIssueTypesQueryHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<List<IssueTypeDto>> Handle(GetIssueTypesQuery request, CancellationToken ct)
    {
        var query = _db.IssueTypes.AsQueryable();
        if (request.ActiveOnly)
            query = query.Where(t => t.IsActive);

        return await query
            .OrderBy(t => t.Name)
            .Select(t => new IssueTypeDto(
                t.Id, t.Name, t.Description, t.Icon, t.Color,
                t.CreatorTier, t.AllowsChildren, t.RequiresParent, t.IsSystemDefault, t.IsActive))
            .ToListAsync(ct);
    }
}