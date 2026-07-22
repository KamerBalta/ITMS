using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Teams.CreateTeam;

public class CreateTeamCommandHandler : IRequestHandler<CreateTeamCommand, Guid>
{
    private readonly IAppDbContext _db;

    public CreateTeamCommandHandler(IAppDbContext db)
    {
        _db = db;
    }

    public async Task<Guid> Handle(CreateTeamCommand request, CancellationToken ct)
    {
        // Girilen takım adını normalize et
        var normalizedName = request.Name.Trim().ToLower();

        // Aynı isimde takım var mı kontrol et (büyük/küçük harf duyarsız)
        var nameExists = await _db.Teams
            .AnyAsync(t => t.Name.ToLower() == normalizedName, ct);

        if (nameExists)
            throw new InvalidOperationException("Bu isimde bir takım zaten mevcut.");

        // Yeni takım oluştur
        var team = new Team
        {
            Name = request.Name.Trim(),
            Description = request.Description,
            CreatedBy = request.CreatedByUserId
        };

        _db.Teams.Add(team);
        await _db.SaveChangesAsync(ct);

        return team.Id;
    }
}