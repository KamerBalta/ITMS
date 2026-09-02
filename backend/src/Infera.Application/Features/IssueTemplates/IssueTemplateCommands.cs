using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.IssueTemplates;

public record CreateIssueTemplateCommand(Guid ProjectId, Guid IssueTypeId, string Name, string? DescriptionTemplate, int? DefaultPriority, bool IsDefault) : IRequest<Guid>;
public record UpdateIssueTemplateCommand(Guid Id, string Name, string? DescriptionTemplate, int? DefaultPriority, bool IsDefault) : IRequest;
public record DeleteIssueTemplateCommand(Guid Id) : IRequest;
public record GetIssueTemplatesQuery(Guid ProjectId) : IRequest<List<IssueTemplateDto>>;

public record IssueTemplateDto(Guid Id, Guid IssueTypeId, string IssueTypeName, string Name, string? DescriptionTemplate, int? DefaultPriority, bool IsDefault);

public class CreateIssueTemplateCommandHandler : IRequestHandler<CreateIssueTemplateCommand, Guid>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;
    public CreateIssueTemplateCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth) { _db = db; _projectAuth = projectAuth; }

    public async System.Threading.Tasks.Task<Guid> Handle(CreateIssueTemplateCommand request, CancellationToken ct)
    {
        await _projectAuth.EnsureProjectManagerOrAdminAsync(request.ProjectId, ct);

        var typeAssigned = await _db.ProjectIssueTypeAssignments.AnyAsync(a => a.ProjectId == request.ProjectId && a.IssueTypeId == request.IssueTypeId, ct);
        if (!typeAssigned) throw new InvalidOperationException("Bu issue type bu projeye tanımlı değil.");

        var exists = await _db.IssueTemplates.AnyAsync(t => t.ProjectId == request.ProjectId && t.Name == request.Name, ct);
        if (exists) throw new InvalidOperationException("Bu isimde bir şablon zaten var.");

        // #3: bir Issue Type icin en fazla BIR varsayilan sablon olabilir -- yenisi
        // varsayilan olarak isaretlenirse, o tip icin var olan digerlerinin
        // varsayilan isaretini otomatik kaldiriyoruz.
        if (request.IsDefault)
        {
            var existingDefaults = await _db.IssueTemplates
                .Where(t => t.ProjectId == request.ProjectId && t.IssueTypeId == request.IssueTypeId && t.IsDefault)
                .ToListAsync(ct);
            foreach (var t in existingDefaults) t.IsDefault = false;
        }

        var entity = new IssueTemplate
        {
            ProjectId = request.ProjectId,
            IssueTypeId = request.IssueTypeId,
            Name = request.Name,
            DescriptionTemplate = request.DescriptionTemplate,
            DefaultPriority = request.DefaultPriority,
            IsDefault = request.IsDefault,
        };
        _db.IssueTemplates.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity.Id;
    }
}

public class UpdateIssueTemplateCommandHandler : IRequestHandler<UpdateIssueTemplateCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;
    public UpdateIssueTemplateCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth) { _db = db; _projectAuth = projectAuth; }

    public async System.Threading.Tasks.Task Handle(UpdateIssueTemplateCommand request, CancellationToken ct)
    {
        var entity = await _db.IssueTemplates.FirstOrDefaultAsync(t => t.Id == request.Id, ct) ?? throw new KeyNotFoundException("Şablon bulunamadı.");
        await _projectAuth.EnsureProjectManagerOrAdminAsync(entity.ProjectId, ct);

        if (request.IsDefault && !entity.IsDefault)
        {
            var existingDefaults = await _db.IssueTemplates
                .Where(t => t.ProjectId == entity.ProjectId && t.IssueTypeId == entity.IssueTypeId && t.IsDefault && t.Id != entity.Id)
                .ToListAsync(ct);
            foreach (var t in existingDefaults) t.IsDefault = false;
        }

        entity.Name = request.Name;
        entity.DescriptionTemplate = request.DescriptionTemplate;
        entity.DefaultPriority = request.DefaultPriority;
        entity.IsDefault = request.IsDefault;
        await _db.SaveChangesAsync(ct);
    }
}

public class DeleteIssueTemplateCommandHandler : IRequestHandler<DeleteIssueTemplateCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;
    public DeleteIssueTemplateCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth) { _db = db; _projectAuth = projectAuth; }

    public async System.Threading.Tasks.Task Handle(DeleteIssueTemplateCommand request, CancellationToken ct)
    {
        var entity = await _db.IssueTemplates.FirstOrDefaultAsync(t => t.Id == request.Id, ct) ?? throw new KeyNotFoundException("Şablon bulunamadı.");
        await _projectAuth.EnsureProjectManagerOrAdminAsync(entity.ProjectId, ct);
        _db.IssueTemplates.Remove(entity);
        await _db.SaveChangesAsync(ct);
    }
}

public class GetIssueTemplatesQueryHandler : IRequestHandler<GetIssueTemplatesQuery, List<IssueTemplateDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;
    public GetIssueTemplatesQueryHandler(IAppDbContext db, IProjectAccessService access) { _db = db; _access = access; }

    public async System.Threading.Tasks.Task<List<IssueTemplateDto>> Handle(GetIssueTemplatesQuery request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        return await _db.IssueTemplates
            .Where(t => t.ProjectId == request.ProjectId)
            .OrderBy(t => t.Name)
            .Select(t => new IssueTemplateDto(t.Id, t.IssueTypeId, t.IssueType.Name, t.Name, t.DescriptionTemplate, t.DefaultPriority, t.IsDefault))
            .ToListAsync(ct);
    }
}