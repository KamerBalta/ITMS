using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Teams.RemoveTeamMember;

public class RemoveTeamMemberCommandHandler : IRequestHandler<RemoveTeamMemberCommand>
{
    private readonly IAppDbContext _db;
    public RemoveTeamMemberCommandHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task Handle(RemoveTeamMemberCommand request, CancellationToken ct)
    {
        var member = await _db.TeamMembers
            .FirstOrDefaultAsync(tm => tm.TeamId == request.TeamId && tm.UserId == request.UserId, ct)
            ?? throw new KeyNotFoundException("Bu kullanıcı takımın üyesi değil.");

        // Not: Bu kullanicinin ayni takim uzerinden ProjectMembers kayitlari varsa
        // onlar burada otomatik silinmez (DB'de cascade tanimlamadik) -- veri butunlugu
        // acisindan bilerek boyle biraktim, PM/Admin bu durumu ProjectMembers ekranindan
        // ayrica yonetmeli. Ileride istersen burada bir uyari/engel ekleyebiliriz.

        _db.TeamMembers.Remove(member);
        await _db.SaveChangesAsync(ct);
    }
}