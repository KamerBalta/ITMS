using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.ProjectMembers.AddProjectMember;

public class AddProjectMemberCommandHandler : IRequestHandler<AddProjectMemberCommand, Guid>
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserService _currentUser;

    public AddProjectMemberCommandHandler(IAppDbContext db, ICurrentUserService currentUser)
    {
        _db = db;
        _currentUser = currentUser;
    }

    public async Task<Guid> Handle(AddProjectMemberCommand request, CancellationToken ct)
    {
        var project = await _db.Projects.FirstOrDefaultAsync(p => p.Id == request.ProjectId, ct)
            ?? throw new KeyNotFoundException("Proje bulunamadı.");

        // Yetki: Admin her projede işlem yapabilir, PM sadece kendi projesinde (Owner)
        if (!_currentUser.IsAdmin && project.OwnerId != _currentUser.UserId)
            throw new UnauthorizedAccessException("Bu projede üye ekleme yetkiniz yok.");

        // DB-009: TeamId, ilgili ProjectId için ProjectTeams'de tanımlı olmalı
        var teamAssigned = await _db.ProjectTeams
            .AnyAsync(pt => pt.ProjectId == request.ProjectId && pt.TeamId == request.TeamId, ct);
        if (!teamAssigned)
            throw new InvalidOperationException("Belirtilen takım bu projeye atanmamış.");

        var userExists = await _db.Users.AnyAsync(u => u.Id == request.UserId && u.IsActive, ct);
        if (!userExists)
            throw new KeyNotFoundException("Kullanıcı bulunamadı veya pasif.");

        // Soft-delete uygulanmış üyeleri de kapsayacak şekilde kontrol et
        var existingMember = await _db.ProjectMembers
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(
                x => x.ProjectId == request.ProjectId &&
                     x.UserId == request.UserId,
                ct);

        Guid resultId;

        if (existingMember != null)
        {
            // Zaten aktif bir üyeyse çift eklemeyi engelle (İsteğe bağlı ek kontrol)
            if (!existingMember.IsDeleted)
            {
                throw new InvalidOperationException("Bu kullanıcı zaten bu projenin aktif bir üyesidir.");
            }

            // Soft-deleted üye varsa kaydı yeniden aktifleştir ve bilgilerini güncelle
            existingMember.IsDeleted = false;
            existingMember.TeamId = request.TeamId;
            existingMember.ProjectRole = request.ProjectRole;

            resultId = existingMember.Id;
        }
        else
        {
            // Hiç kaydı yoksa yeni üye oluştur
            var member = new ProjectMember
            {
                ProjectId = request.ProjectId,
                TeamId = request.TeamId,
                UserId = request.UserId,
                ProjectRole = request.ProjectRole
            };

            _db.ProjectMembers.Add(member);
            resultId = member.Id;
        }

        await _db.SaveChangesAsync(ct);

        return resultId;
    }
}