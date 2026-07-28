using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Projects.AddTeamToProject;

public class AddTeamToProjectCommandHandler : IRequestHandler<AddTeamToProjectCommand, Guid>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public AddTeamToProjectCommandHandler(IAppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async System.Threading.Tasks.Task<Guid> Handle(AddTeamToProjectCommand request, CancellationToken ct)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.Id == request.ProjectId, ct)
            ?? throw new KeyNotFoundException("Proje bulunamadı.");

        if (!_currentUser.IsAdmin && project.OwnerId != _currentUser.UserId)
            throw new UnauthorizedAccessException("Bu projeye takım ekleme yetkiniz yok.");

        var teamExists = await _db.Teams.AnyAsync(t => t.Id == request.TeamId, ct);
        if (!teamExists)
            throw new KeyNotFoundException("Takım bulunamadı.");

        if (!_currentUser.IsAdmin)
        {
            var isOwnTeam = await _db.TeamMembers
                .AnyAsync(tm => tm.TeamId == request.TeamId && tm.UserId == _currentUser.UserId, ct);
            if (!isOwnTeam)
                throw new UnauthorizedAccessException("Yalnızca üyesi olduğunuz bir takımı projeye ekleyebilirsiniz.");
        }

        var alreadyAssigned = await _db.ProjectTeams
            .AnyAsync(pt => pt.ProjectId == request.ProjectId && pt.TeamId == request.TeamId, ct);
        if (alreadyAssigned)
            throw new InvalidOperationException("Bu takım zaten bu projeye atanmış.");

        var link = new ProjectTeam { ProjectId = request.ProjectId, TeamId = request.TeamId };
        _db.ProjectTeams.Add(link);
        await _db.SaveChangesAsync(ct);

        return link.Id;
    }
}