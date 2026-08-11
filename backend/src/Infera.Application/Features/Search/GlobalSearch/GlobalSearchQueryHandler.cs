using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Search.GlobalSearch;

public class GlobalSearchQueryHandler : IRequestHandler<GlobalSearchQuery, SearchResultsDto>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GlobalSearchQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<SearchResultsDto> Handle(GlobalSearchQuery request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Query) || request.Query.Length < 2)
            return new SearchResultsDto(new(), new(), new());

        var pattern = $"%{request.Query}%";
        var accessibleProjectIds = await _access.GetAccessibleProjectIdsAsync(ct);

        var tasks = await _db.Tasks
            .Where(t => accessibleProjectIds.Contains(t.ProjectId) &&
                (EF.Functions.ILike(t.Title, pattern) || t.TaskLabels.Any(tl => EF.Functions.ILike(tl.Label.Name, pattern))))
            .OrderByDescending(t => t.CreatedAt)
            .Take(10)
            .Select(t => new TaskResultDto(t.Id, t.Title, t.Project.Name, t.Status.ToString()))
            .ToListAsync(ct);

        var projects = await _db.Projects
            .Where(p => accessibleProjectIds.Contains(p.Id) && (EF.Functions.ILike(p.Name, pattern) || EF.Functions.ILike(p.Key, pattern)))
            .Take(5)
            .Select(p => new ProjectResultDto(p.Id, p.Name, p.Key))
            .ToListAsync(ct);

        // Kullanıcılar için "erişim" kavramı farklı: sadece kendi erişebildiğin projelerin
        // üyeleri arasında arama yapıyoruz -- sistemdeki tüm kullanıcıları değil.
        var accessibleUserIds = await _db.ProjectMembers
            .Where(m => accessibleProjectIds.Contains(m.ProjectId))
            .Select(m => m.UserId)
            .Distinct()
            .ToListAsync(ct);

        var users = await _db.Users
            .Where(u => u.IsActive && accessibleUserIds.Contains(u.Id) &&
                        (EF.Functions.ILike(u.Name, pattern) || EF.Functions.ILike(u.Email, pattern)))
            .Take(5)
            .Select(u => new UserResultDto(u.Id, u.Name, u.Email))
            .ToListAsync(ct);

        return new SearchResultsDto(tasks, projects, users);
    }
}