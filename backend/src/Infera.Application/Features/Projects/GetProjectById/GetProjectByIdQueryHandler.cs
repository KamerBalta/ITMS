using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Projects.GetProjectById;

public class GetProjectByIdQueryHandler : IRequestHandler<GetProjectByIdQuery, ProjectDetailDto>
{
    private readonly IAppDbContext _db;
    private readonly IProjectAccessService _access;

    public GetProjectByIdQueryHandler(IAppDbContext db, IProjectAccessService access)
    {
        _db = db;
        _access = access;
    }

    public async System.Threading.Tasks.Task<ProjectDetailDto> Handle(GetProjectByIdQuery request, CancellationToken ct)
    {
        if (!await _access.HasProjectAccessAsync(request.ProjectId, ct))
            throw new UnauthorizedAccessException("Bu projeye erişim yetkiniz yok.");

        var project = await _db.Projects
            .Where(p => p.Id == request.ProjectId)
            .Select(p => new ProjectDetailDto(
                p.Id, p.Name, p.Key, p.Description, p.Owner.Name, p.Status.ToString(),
                p.StartDate, p.EndDate, p.CreatedAt,
                p.ProjectTeams.Select(pt => pt.Team.Name).ToList(),
                p.Members.Count, p.Tasks.Count))
            .FirstOrDefaultAsync(ct);

        return project ?? throw new KeyNotFoundException("Proje bulunamadı.");
    }
}