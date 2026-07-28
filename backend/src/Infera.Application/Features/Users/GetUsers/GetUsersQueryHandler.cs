using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Users.GetUsers;

public class GetUsersQueryHandler : IRequestHandler<GetUsersQuery, List<UserListDto>>
{
    private readonly IAppDbContext _db;
    public GetUsersQueryHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<List<UserListDto>> Handle(GetUsersQuery request, CancellationToken ct)
    {
        return await _db.Users
            .OrderBy(u => u.Name)
            .Select(u => new UserListDto(
                u.Id, u.Name, u.Email, u.Title, u.IsActive,
                u.UserRoles.Select(ur => ur.Role.Name).ToList()))
            .ToListAsync(ct);
    }
}