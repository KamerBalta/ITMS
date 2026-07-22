using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Projects.CreateProject;

public class CreateProjectCommandHandler : IRequestHandler<CreateProjectCommand, Guid>
{
    private readonly IAppDbContext _db;
    public CreateProjectCommandHandler(IAppDbContext db) => _db = db;

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

        await _db.SaveChangesAsync(ct);

        return project.Id;
    }
}