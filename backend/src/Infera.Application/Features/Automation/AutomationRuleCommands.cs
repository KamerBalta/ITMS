using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Automation;

public record CreateAutomationRuleCommand(Guid ProjectId, string Name, string TriggerType, string? TriggerConditionJson, string ActionType, string ActionParamsJson) : IRequest<Guid>;
public record ToggleAutomationRuleCommand(Guid Id) : IRequest;
public record DeleteAutomationRuleCommand(Guid Id) : IRequest;
public record GetAutomationRulesQuery(Guid ProjectId) : IRequest<List<AutomationRuleDto>>;
public record AutomationRuleDto(Guid Id, string Name, string TriggerType, string? TriggerConditionJson, string ActionType, string ActionParamsJson, bool IsActive);

public class CreateAutomationRuleCommandHandler : IRequestHandler<CreateAutomationRuleCommand, Guid>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;

    public CreateAutomationRuleCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth)
    {
        _db = db;
        _projectAuth = projectAuth;
    }

    public async System.Threading.Tasks.Task<Guid> Handle(CreateAutomationRuleCommand request, CancellationToken ct)
    {
        await _projectAuth.EnsureProjectManagerOrAdminAsync(request.ProjectId, ct);

        var entity = new AutomationRule
        {
            ProjectId = request.ProjectId,
            Name = request.Name,
            TriggerType = request.TriggerType,
            TriggerConditionJson = request.TriggerConditionJson,
            ActionType = request.ActionType,
            ActionParamsJson = request.ActionParamsJson,
        };
        _db.AutomationRules.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity.Id;
    }
}

public class ToggleAutomationRuleCommandHandler : IRequestHandler<ToggleAutomationRuleCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;

    public ToggleAutomationRuleCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth)
    {
        _db = db;
        _projectAuth = projectAuth;
    }

    public async System.Threading.Tasks.Task Handle(ToggleAutomationRuleCommand request, CancellationToken ct)
    {
        var entity = await _db.AutomationRules.FirstOrDefaultAsync(r => r.Id == request.Id, ct) ?? throw new KeyNotFoundException("Kural bulunamadı.");
        await _projectAuth.EnsureProjectManagerOrAdminAsync(entity.ProjectId, ct);
        entity.IsActive = !entity.IsActive;
        await _db.SaveChangesAsync(ct);
    }
}

public class DeleteAutomationRuleCommandHandler : IRequestHandler<DeleteAutomationRuleCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectManagementAuthService _projectAuth;

    public DeleteAutomationRuleCommandHandler(IAppDbContext db, IProjectManagementAuthService projectAuth)
    {
        _db = db;
        _projectAuth = projectAuth;
    }

    public async System.Threading.Tasks.Task Handle(DeleteAutomationRuleCommand request, CancellationToken ct)
    {
        var entity = await _db.AutomationRules.FirstOrDefaultAsync(r => r.Id == request.Id, ct) ?? throw new KeyNotFoundException("Kural bulunamadı.");
        await _projectAuth.EnsureProjectManagerOrAdminAsync(entity.ProjectId, ct);
        _db.AutomationRules.Remove(entity);
        await _db.SaveChangesAsync(ct);
    }
}

public class GetAutomationRulesQueryHandler : IRequestHandler<GetAutomationRulesQuery, List<AutomationRuleDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetAutomationRulesQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<List<AutomationRuleDto>> Handle(GetAutomationRulesQuery request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        return await _db.AutomationRules
            .Where(r => r.ProjectId == request.ProjectId)
            .Select(r => new AutomationRuleDto(r.Id, r.Name, r.TriggerType, r.TriggerConditionJson, r.ActionType, r.ActionParamsJson, r.IsActive))
            .ToListAsync(ct);
    }
}