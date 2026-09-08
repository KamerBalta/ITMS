using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.SavedFilters;

public record CreateSavedFilterCommand(
    Guid ProjectId,
    string Name,
    string FiltersJson,
    bool IsShared,
    string Scope) : IRequest<Guid>;

public record DeleteSavedFilterCommand(Guid Id) : IRequest;

public record GetSavedFiltersQuery(
    Guid ProjectId,
    string Scope) : IRequest<List<SavedFilterDto>>;

public record SavedFilterDto(
    Guid Id,
    string Name,
    string FiltersJson,
    bool IsShared,
    bool IsOwner,
    string CreatedByName,
    string Scope);

public class CreateSavedFilterCommandHandler : IRequestHandler<CreateSavedFilterCommand, Guid>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IProjectAccessService _access;

    public CreateSavedFilterCommandHandler(IAppDbContext db, ICurrentUserService currentUser, IProjectAccessService access)
    {
        _db = db;
        _currentUser = currentUser;
        _access = access;
    }

    public async System.Threading.Tasks.Task<Guid> Handle(CreateSavedFilterCommand request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        if (string.IsNullOrWhiteSpace(request.Name))
            throw new InvalidOperationException("Filtre adı boş olamaz.");

        if (request.Scope is not ("board" or "issue-list"))
            throw new InvalidOperationException("Geçersiz filtre kapsamı.");

        var nameConflict = await _db.SavedFilters
            .AnyAsync(f => f.ProjectId == request.ProjectId && f.CreatedByUserId == _currentUser.UserId && f.Name == request.Name, ct);
        if (nameConflict)
            throw new InvalidOperationException("Bu isimde bir filtreniz zaten var.");

        var filter = new SavedFilter
        {
            ProjectId = request.ProjectId,
            CreatedByUserId = _currentUser.UserId,
            Name = request.Name,
            FiltersJson = request.FiltersJson,
            IsShared = request.IsShared,
            Scope = request.Scope,
        };
        _db.SavedFilters.Add(filter);
        await _db.SaveChangesAsync(ct);
        return filter.Id;
    }
}

public class DeleteSavedFilterCommandHandler : IRequestHandler<DeleteSavedFilterCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public DeleteSavedFilterCommandHandler(IAppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async System.Threading.Tasks.Task Handle(DeleteSavedFilterCommand request, CancellationToken ct)
    {
        var filter = await _db.SavedFilters.FirstOrDefaultAsync(f => f.Id == request.Id, ct)
            ?? throw new KeyNotFoundException("Filtre bulunamadı.");

        // Sahibi veya Admin silebilir -- paylasilan bir filtreyi baskasi silemesin.
        if (filter.CreatedByUserId != _currentUser.UserId && !_currentUser.IsAdmin)
            throw new UnauthorizedAccessException("Yalnızca kendi oluşturduğunuz filtreyi silebilirsiniz.");

        _db.SavedFilters.Remove(filter);
        await _db.SaveChangesAsync(ct);
    }
}

public class GetSavedFiltersQueryHandler : IRequestHandler<GetSavedFiltersQuery, List<SavedFilterDto>>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly IProjectAccessService _access;

    public GetSavedFiltersQueryHandler(IAppDbContext db, ICurrentUserService currentUser, IProjectAccessService access)
    {
        _db = db;
        _currentUser = currentUser;
        _access = access;
    }

    public async System.Threading.Tasks.Task<List<SavedFilterDto>> Handle(GetSavedFiltersQuery request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        var currentUserId = _currentUser.UserId;

        // İlgili Scope'a ait: Kendi filtrelerin + paylaşılan (IsShared=true) filtreler
        return await _db.SavedFilters
            .Where(f => f.ProjectId == request.ProjectId &&
                        f.Scope == request.Scope &&
                        (f.CreatedByUserId == currentUserId || f.IsShared))
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new SavedFilterDto(
                f.Id,
                f.Name,
                f.FiltersJson,
                f.IsShared,
                f.CreatedByUserId == currentUserId,
                f.CreatedByUser.Name,
                f.Scope))
            .ToListAsync(ct);
    }
}