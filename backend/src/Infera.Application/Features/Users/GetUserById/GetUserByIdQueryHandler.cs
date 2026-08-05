using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Users.GetUserById;

public class GetUserByIdQueryHandler : IRequestHandler<GetUserByIdQuery, UserDetailDto>
{
    private readonly IAppDbContext _db;
    public GetUserByIdQueryHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<UserDetailDto> Handle(GetUserByIdQuery request, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, ct)
            ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");

        var systemRoles = await _db.UserRoles
            .Where(ur => ur.UserId == request.UserId)
            .Select(ur => ur.Role.Name)
            .ToListAsync(ct);

        var projects = await _db.ProjectMembers
            .Where(m => m.UserId == request.UserId)
            .Select(m => new UserProjectDto(m.ProjectId, m.Project.Name, m.ProjectRole.ToString()))
            .ToListAsync(ct);

        var teams = await _db.TeamMembers
            .Where(tm => tm.UserId == request.UserId)
            .Select(tm => tm.Team.Name)
            .ToListAsync(ct);

        var createdTaskCount = await _db.Tasks.CountAsync(t => t.ReporterId == request.UserId, ct);
        var assignedTaskCount = await _db.Tasks.CountAsync(t => t.AssigneeId == request.UserId, ct);

        return new UserDetailDto(
            user.Id, user.Name, user.Email, user.Title, user.AvatarUrl, user.IsActive, user.CreatedAt,
            systemRoles, projects, teams, createdTaskCount, assignedTaskCount);
    }
}