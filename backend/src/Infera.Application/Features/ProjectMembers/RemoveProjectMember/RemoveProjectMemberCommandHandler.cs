using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.ProjectMembers.RemoveProjectMember;

public class RemoveProjectMemberCommandHandler : IRequestHandler<RemoveProjectMemberCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public RemoveProjectMemberCommandHandler(IAppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async System.Threading.Tasks.Task Handle(RemoveProjectMemberCommand request, CancellationToken ct)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.Id == request.ProjectId, ct)
            ?? throw new KeyNotFoundException("Proje bulunamadı.");

        if (!_currentUser.IsAdmin && project.OwnerId != _currentUser.UserId)
            throw new UnauthorizedAccessException("Bu projede üye çıkarma yetkiniz yok.");

        var member = await _db.ProjectMembers
            .FirstOrDefaultAsync(m => m.Id == request.MemberId && m.ProjectId == request.ProjectId, ct)
            ?? throw new KeyNotFoundException("Üyelik kaydı bulunamadı.");

        _db.ProjectMembers.Remove(member);
        await _db.SaveChangesAsync(ct);
    }
}