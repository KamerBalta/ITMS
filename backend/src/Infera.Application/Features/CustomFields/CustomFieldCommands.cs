using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.CustomFields;

public record CreateCustomFieldCommand(Guid ProjectId, string Name, string FieldType, string? OptionsJson, bool IsRequired) : IRequest<Guid>;
public record DeleteCustomFieldCommand(Guid Id) : IRequest;
public record GetCustomFieldsQuery(Guid ProjectId) : IRequest<List<CustomFieldDto>>;
public record SetTaskCustomFieldValueCommand(Guid TaskId, Guid FieldId, string? Value) : IRequest;
public record GetTaskCustomFieldValuesQuery(Guid TaskId) : IRequest<List<TaskCustomFieldValueDto>>;

public record CustomFieldDto(Guid Id, string Name, string FieldType, string? OptionsJson, bool IsRequired, int DisplayOrder);
public record TaskCustomFieldValueDto(Guid FieldId, string Name, string FieldType, string? Value);

file static class CustomFieldAuthorization
{
    public static async System.Threading.Tasks.Task EnsureCanManageAsync(IAppDbContext db, ICurrentUserService currentUser, Guid projectId, CancellationToken ct)
    {
        if (currentUser.IsAdmin) return;
        var project = await db.Projects.FirstOrDefaultAsync(p => p.Id == projectId, ct) ?? throw new KeyNotFoundException("Proje bulunamadı.");
        if (project.OwnerId != currentUser.UserId)
            throw new UnauthorizedAccessException("Bu projede özel alan yönetimi yapma yetkiniz yok.");
    }
}

public class CreateCustomFieldCommandHandler : IRequestHandler<CreateCustomFieldCommand, Guid>
{
    private static readonly HashSet<string> ValidTypes = new() { "text", "number", "select", "user" };
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public CreateCustomFieldCommandHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task<Guid> Handle(CreateCustomFieldCommand request, CancellationToken ct)
    {
        await CustomFieldAuthorization.EnsureCanManageAsync(_db, _currentUser, request.ProjectId, ct);

        if (!ValidTypes.Contains(request.FieldType))
            throw new InvalidOperationException("Geçersiz alan tipi.");

        var exists = await _db.CustomFieldDefinitions.AnyAsync(f => f.ProjectId == request.ProjectId && f.Name == request.Name, ct);
        if (exists) throw new InvalidOperationException("Bu isimde bir özel alan zaten var.");

        var maxOrder = await _db.CustomFieldDefinitions.Where(f => f.ProjectId == request.ProjectId).Select(f => (int?)f.DisplayOrder).MaxAsync(ct) ?? -1;

        var entity = new CustomFieldDefinition
        {
            ProjectId = request.ProjectId,
            Name = request.Name,
            FieldType = request.FieldType,
            OptionsJson = request.OptionsJson,
            IsRequired = request.IsRequired,
            DisplayOrder = maxOrder + 1,
        };
        _db.CustomFieldDefinitions.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity.Id;
    }
}

public class DeleteCustomFieldCommandHandler : IRequestHandler<DeleteCustomFieldCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    public DeleteCustomFieldCommandHandler(IAppDbContext db, ICurrentUserService currentUser) { _db = db; _currentUser = currentUser; }

    public async System.Threading.Tasks.Task Handle(DeleteCustomFieldCommand request, CancellationToken ct)
    {
        var entity = await _db.CustomFieldDefinitions.FirstOrDefaultAsync(f => f.Id == request.Id, ct)
            ?? throw new KeyNotFoundException("Özel alan bulunamadı.");
        await CustomFieldAuthorization.EnsureCanManageAsync(_db, _currentUser, entity.ProjectId, ct);

        _db.CustomFieldDefinitions.Remove(entity); // TaskCustomFieldValues cascade ile silinir
        await _db.SaveChangesAsync(ct);
    }
}

public class GetCustomFieldsQueryHandler : IRequestHandler<GetCustomFieldsQuery, List<CustomFieldDto>>
{
    private readonly IAppDbContext _db;
    public GetCustomFieldsQueryHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<List<CustomFieldDto>> Handle(GetCustomFieldsQuery request, CancellationToken ct)
    {
        return await _db.CustomFieldDefinitions
            .Where(f => f.ProjectId == request.ProjectId)
            .OrderBy(f => f.DisplayOrder)
            .Select(f => new CustomFieldDto(f.Id, f.Name, f.FieldType, f.OptionsJson, f.IsRequired, f.DisplayOrder))
            .ToListAsync(ct);
    }
}

public class SetTaskCustomFieldValueCommandHandler : IRequestHandler<SetTaskCustomFieldValueCommand>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;
    public SetTaskCustomFieldValueCommandHandler(IAppDbContext db, IProjectAccessService access) { _db = db; _access = access; }

    public async System.Threading.Tasks.Task Handle(SetTaskCustomFieldValueCommand request, CancellationToken ct)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == request.TaskId, ct) ?? throw new KeyNotFoundException("Görev bulunamadı.");
        if (!await _access.HasProjectAccessAsync(task.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu göreve erişim yetkiniz yok.");

        var field = await _db.CustomFieldDefinitions.FirstOrDefaultAsync(f => f.Id == request.FieldId && f.ProjectId == task.ProjectId, ct)
            ?? throw new KeyNotFoundException("Bu proje için tanımlı böyle bir özel alan yok.");

        if (field.IsRequired && string.IsNullOrWhiteSpace(request.Value))
            throw new InvalidOperationException($"'{field.Name}' alanı zorunludur.");

        var existing = await _db.TaskCustomFieldValues
            .FirstOrDefaultAsync(v => v.TaskId == request.TaskId && v.CustomFieldDefinitionId == request.FieldId, ct);

        if (string.IsNullOrEmpty(request.Value))
        {
            if (existing is not null) _db.TaskCustomFieldValues.Remove(existing);
        }
        else if (existing is null)
        {
            _db.TaskCustomFieldValues.Add(new TaskCustomFieldValue { TaskId = request.TaskId, CustomFieldDefinitionId = request.FieldId, Value = request.Value });
        }
        else
        {
            existing.Value = request.Value;
        }

        await _db.SaveChangesAsync(ct);
    }
}

public class GetTaskCustomFieldValuesQueryHandler : IRequestHandler<GetTaskCustomFieldValuesQuery, List<TaskCustomFieldValueDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;
    public GetTaskCustomFieldValuesQueryHandler(IAppDbContext db, IProjectAccessService access) { _db = db; _access = access; }

    public async System.Threading.Tasks.Task<List<TaskCustomFieldValueDto>> Handle(GetTaskCustomFieldValuesQuery request, CancellationToken ct)
    {
        var task = await _db.Tasks.FirstOrDefaultAsync(t => t.Id == request.TaskId, ct) ?? throw new KeyNotFoundException("Görev bulunamadı.");
        if (!await _access.HasProjectAccessAsync(task.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu göreve erişim yetkiniz yok.");

        var fields = await _db.CustomFieldDefinitions.Where(f => f.ProjectId == task.ProjectId).OrderBy(f => f.DisplayOrder).ToListAsync(ct);
        var values = await _db.TaskCustomFieldValues.Where(v => v.TaskId == request.TaskId).ToDictionaryAsync(v => v.CustomFieldDefinitionId, ct);

        return fields.Select(f => new TaskCustomFieldValueDto(f.Id, f.Name, f.FieldType, values.TryGetValue(f.Id, out var v) ? v.Value : null)).ToList();
    }
}