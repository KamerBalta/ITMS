using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infera.Application.Features.ProjectMembers.UpdateProjectMember;

public class UpdateProjectMemberCommandHandler
    : IRequestHandler<UpdateProjectMemberCommand>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;
    private readonly ILogger<UpdateProjectMemberCommandHandler> _logger;

    public UpdateProjectMemberCommandHandler(
        IAppDbContext db,
        ICurrentUserService currentUser,
        ILogger<UpdateProjectMemberCommandHandler> logger)
    {
        _db = db;
        _currentUser = currentUser;
        _logger = logger;
    }

    public async Task Handle(UpdateProjectMemberCommand request, CancellationToken ct)
    {
        var project = await _db.Projects
            .FirstOrDefaultAsync(p => p.Id == request.ProjectId, ct)
            ?? throw new KeyNotFoundException("Proje bulunamadı.");

        if (!_currentUser.IsAdmin &&
            project.OwnerId != _currentUser.UserId)
        {
            throw new UnauthorizedAccessException("Bu projede üye düzenleme yetkiniz yok.");
        }

        var member = await _db.ProjectMembers
            .FirstOrDefaultAsync(
                x => x.Id == request.MemberId &&
                     x.ProjectId == request.ProjectId,
                ct)
            ?? throw new KeyNotFoundException("Proje üyesi bulunamadı.");

        var teamAssigned = await _db.ProjectTeams
            .AnyAsync(
                x => x.ProjectId == request.ProjectId &&
                     x.TeamId == request.TeamId,
                ct);

        if (!teamAssigned)
            throw new InvalidOperationException("Belirtilen takım bu projeye atanmamış.");

        member.TeamId = request.TeamId;
        member.ProjectRole = request.ProjectRole;

        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("Proje üyesi başarıyla güncellendi. MemberId: {MemberId}, ProjectId: {ProjectId}",
            request.MemberId, request.ProjectId);
    }
}