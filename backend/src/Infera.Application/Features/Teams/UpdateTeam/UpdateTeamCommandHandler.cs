using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Teams.UpdateTeam;

public class UpdateTeamCommandHandler : IRequestHandler<UpdateTeamCommand>
{
    private readonly IAppDbContext _db;
    public UpdateTeamCommandHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task Handle(UpdateTeamCommand request, CancellationToken ct)
    {
        var team = await _db.Teams.FirstOrDefaultAsync(t => t.Id == request.TeamId, ct)
            ?? throw new KeyNotFoundException("Takım bulunamadı.");

        var nameConflict = await _db.Teams.AnyAsync(t => t.Name == request.Name && t.Id != request.TeamId, ct);
        if (nameConflict)
            throw new InvalidOperationException("Bu isimde başka bir takım zaten mevcut.");

        team.Name = request.Name;
        team.Description = request.Description;

        await _db.SaveChangesAsync(ct);
    }
}