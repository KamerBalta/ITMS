using Infera.Application.Common.Interfaces;
using Infera.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Users.UpdateUserRole;

public class UpdateUserRoleCommandHandler : IRequestHandler<UpdateUserRoleCommand>
{
    private readonly IAppDbContext _db;
    public UpdateUserRoleCommandHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task Handle(UpdateUserRoleCommand request, CancellationToken ct)
    {
        var userExists = await _db.Users.AnyAsync(u => u.Id == request.UserId, ct);
        if (!userExists)
            throw new KeyNotFoundException("Kullanıcı bulunamadı.");

        var role = await _db.Roles.FirstOrDefaultAsync(r => r.Name == request.RoleName, ct)
            ?? throw new KeyNotFoundException($"'{request.RoleName}' adında bir rol bulunamadı.");

        // Mevcut rolleri temizle, tek rol atama modeliyle degistir (basitlik icin)
        var existingRoles = await _db.UserRoles.Where(ur => ur.UserId == request.UserId).ToListAsync(ct);
        _db.UserRoles.RemoveRange(existingRoles);

        _db.UserRoles.Add(new UserRole { UserId = request.UserId, RoleId = role.Id });
        await _db.SaveChangesAsync(ct);
    }
}