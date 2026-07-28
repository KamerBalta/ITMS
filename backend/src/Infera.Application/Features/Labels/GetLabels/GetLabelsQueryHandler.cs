using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Labels.GetLabels;

public class GetLabelsQueryHandler : IRequestHandler<GetLabelsQuery, List<LabelDto>>
{
    private readonly IAppDbContext _db;
    public GetLabelsQueryHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<List<LabelDto>> Handle(GetLabelsQuery request, CancellationToken ct)
    {
        return await _db.Labels
            .OrderBy(l => l.Name)
            .Select(l => new LabelDto(l.Id, l.Name, l.Color))
            .ToListAsync(ct);
    }
}