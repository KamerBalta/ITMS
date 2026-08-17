using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Search.GetSuggestions;

public class GetSuggestionsQueryHandler : IRequestHandler<GetSuggestionsQuery, List<string>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetSuggestionsQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<List<string>> Handle(GetSuggestionsQuery request, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(request.Query) || request.Query.Length < 2)
            return new List<string>();

        var pattern = $"{request.Query}%";
        var accessibleProjectIds = await _access.GetAccessibleProjectIdsAsync(ct);

        return await _db.Tasks.Where(t => accessibleProjectIds.Contains(t.ProjectId) &&
        EF.Functions.ToTsVector("simple", t.Title).Matches(EF.Functions.ToTsQuery("simple", request.Query.Trim() + ":*")))
    .OrderByDescending(t => t.CreatedAt)
    .Select(t => t.Title)
    .Distinct()
    .Take(8)
    .ToListAsync(ct);
    }
}