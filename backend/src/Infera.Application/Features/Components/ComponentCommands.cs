using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Components;

public record CreateComponentCommand(Guid ProjectId, string Name, string? Description, Guid? LeadUserId) : IRequest<Guid>;
public record UpdateComponentCommand(Guid Id, string Name, string? Description, Guid? LeadUserId) : IRequest;
public record DeleteComponentCommand(Guid Id) : IRequest;
public record GetComponentsQuery(Guid ProjectId) : IRequest<List<ComponentDto>>;
public record ComponentDto(Guid Id, string Name, string? Description, Guid? LeadUserId, string? LeadUserName, int TaskCount);

public class CreateComponentCommandHandler : IRequestHandler<CreateComponentCommand, Guid>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;

    public CreateComponentCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth)
    {
        _db = db;
        _projectAuth = projectAuth;
    }

    public async System.Threading.Tasks.Task<Guid> Handle(CreateComponentCommand request, CancellationToken ct)
    {
        await _projectAuth.EnsureProjectManagerOrAdminAsync(request.ProjectId, ct);

        var exists = await _db.ProjectComponents.AnyAsync(c => c.ProjectId == request.ProjectId && c.Name == request.Name, ct);
        if (exists) throw new InvalidOperationException("Bu isimde bir component zaten var.");

        if (request.LeadUserId is not null)
        {
            var isMember = await _db.ProjectMembers.AnyAsync(m => m.ProjectId == request.ProjectId && m.UserId == request.LeadUserId, ct);
            if (!isMember) throw new InvalidOperationException("Sorumlu kişi bu projenin üyesi değil.");
        }

        var entity = new ProjectComponent
        {
            ProjectId = request.ProjectId,
            Name = request.Name,
            Description = request.Description,
            LeadUserId = request.LeadUserId
        };

        _db.ProjectComponents.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity.Id;
    }
}

public class UpdateComponentCommandHandler : IRequestHandler<UpdateComponentCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;

    public UpdateComponentCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth)
    {
        _db = db;
        _projectAuth = projectAuth;
    }

    public async System.Threading.Tasks.Task Handle(UpdateComponentCommand request, CancellationToken ct)
    {
        var entity = await _db.ProjectComponents.FirstOrDefaultAsync(c => c.Id == request.Id, ct) ?? throw new KeyNotFoundException("Component bulunamadı.");
        await _projectAuth.EnsureProjectManagerOrAdminAsync(entity.ProjectId, ct);

        if (request.LeadUserId is not null)
        {
            var isMember = await _db.ProjectMembers.AnyAsync(m => m.ProjectId == entity.ProjectId && m.UserId == request.LeadUserId, ct);
            if (!isMember) throw new InvalidOperationException("Sorumlu kişi bu projenin üyesi değil.");
        }

        entity.Name = request.Name;
        entity.Description = request.Description;
        entity.LeadUserId = request.LeadUserId;
        await _db.SaveChangesAsync(ct);
    }
}

public class DeleteComponentCommandHandler : IRequestHandler<DeleteComponentCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;

    public DeleteComponentCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth)
    {
        _db = db;
        _projectAuth = projectAuth;
    }

    public async System.Threading.Tasks.Task Handle(DeleteComponentCommand request, CancellationToken ct)
    {
        var entity = await _db.ProjectComponents.FirstOrDefaultAsync(c => c.Id == request.Id, ct) ?? throw new KeyNotFoundException("Component bulunamadı.");
        await _projectAuth.EnsureProjectManagerOrAdminAsync(entity.ProjectId, ct);

        var inUse = await _db.TaskComponents.AnyAsync(tc => tc.ProjectComponentId == request.Id, ct);
        if (inUse) throw new InvalidOperationException("Bu component en az bir görev tarafından kullanılıyor, önce görevlerden kaldırın.");

        _db.ProjectComponents.Remove(entity);
        await _db.SaveChangesAsync(ct);
    }
}

public class GetComponentsQueryHandler : IRequestHandler<GetComponentsQuery, List<ComponentDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetComponentsQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<List<ComponentDto>> Handle(GetComponentsQuery request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        return await _db.ProjectComponents
            .Where(c => c.ProjectId == request.ProjectId)
            .OrderBy(c => c.Name)
            .Select(c => new ComponentDto(
                c.Id,
                c.Name,
                c.Description,
                c.LeadUserId,
                c.LeadUser != null ? c.LeadUser.Name : null,
                _db.TaskComponents.Count(tc => tc.ProjectComponentId == c.Id)))
            .ToListAsync(ct);
    }
}