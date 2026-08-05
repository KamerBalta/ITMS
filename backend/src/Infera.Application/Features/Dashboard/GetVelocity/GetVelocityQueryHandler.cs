using Infera.Application.Common.Interfaces;
using Infera.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Dashboard.GetVelocity;

public class GetVelocityQueryHandler : IRequestHandler<GetVelocityQuery, List<VelocityDto>>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetVelocityQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<List<VelocityDto>> Handle(GetVelocityQuery request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        return await _db.Sprints
            .Where(s => s.ProjectId == request.ProjectId && s.Status == SprintStatus.Completed)
            .OrderBy(s => s.StartDate)
            .Select(s => new VelocityDto(
                s.Id, s.Name,
                // #4 fix: donmus taahhut degeri kullaniliyor (eskiden hep Completed'e esitti)
                s.CommittedStoryPoints ?? s.Tasks.Sum(t => t.StoryPoint ?? 0),
                s.Tasks.Where(t => t.Status == ItemStatus.Done).Sum(t => t.StoryPoint ?? 0)))
            .ToListAsync(ct);
    }
}