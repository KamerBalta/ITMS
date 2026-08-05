using Infera.Application.Common.Interfaces;
using Infera.Application.Features.ProjectIssueTypes;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Projects.CreateProject;

public class CreateProjectCommandHandler : IRequestHandler<CreateProjectCommand, Guid>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public CreateProjectCommandHandler(IAppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async System.Threading.Tasks.Task<Guid> Handle(CreateProjectCommand request, CancellationToken ct)
    {
        var keyExists = await _db.Projects.AnyAsync(p => p.Key == request.Key, ct);
        if (keyExists)
            throw new InvalidOperationException("Bu proje anahtarı (Key) zaten kullanılıyor.");

        if (request.TeamIds.Count == 0)
            throw new InvalidOperationException("Bir projeye en az bir takım atanmalıdır.");

        var validTeamCount = await _db.Teams.CountAsync(t => request.TeamIds.Contains(t.Id), ct);
        if (validTeamCount != request.TeamIds.Count)
            throw new KeyNotFoundException("Belirtilen takımlardan biri veya birkaçı bulunamadı.");

        // 5.2: Proje Olusturma -- PM yalnizca "Kendi Takimi" ile, Admin "Tum Takimlar" ile olusturabilir.
        if (!_currentUser.IsAdmin)
        {
            var ownTeamIds = await _db.TeamMembers
                .Where(tm => tm.UserId == _currentUser.UserId)
                .Select(tm => tm.TeamId)
                .ToListAsync(ct);

            var unauthorizedTeams = request.TeamIds.Except(ownTeamIds).ToList();
            if (unauthorizedTeams.Count > 0)
                throw new UnauthorizedAccessException("Yalnızca üyesi olduğunuz takımları projeye atayabilirsiniz.");
        }

        // Admin farkli bir Owner belirttiyse, o kullanicinin gercekten var ve aktif oldugunu dogrula.
        var ownerExists = await _db.Users.AnyAsync(u => u.Id == request.OwnerId && u.IsActive, ct);
        if (!ownerExists)
            throw new KeyNotFoundException("Belirtilen proje sahibi (Owner) bulunamadı veya pasif.");

        var project = new Project
        {
            Name = request.Name,
            Key = request.Key,
            Description = request.Description,
            OwnerId = request.OwnerId,
            StartDate = request.StartDate
        };
        _db.Projects.Add(project);

        foreach (var teamId in request.TeamIds)
        {
            _db.ProjectTeams.Add(new ProjectTeam { ProjectId = project.Id, TeamId = teamId });
        }

        await DefaultProjectIssueTypeSeeder.AssignDefaultsAsync(_db, project.Id, ct);

        await _db.SaveChangesAsync(ct);

        return project.Id;
    }
}