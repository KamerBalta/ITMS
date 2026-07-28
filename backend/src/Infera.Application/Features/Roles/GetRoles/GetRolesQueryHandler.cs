using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Roles.GetRoles;

public class GetRolesQueryHandler : IRequestHandler<GetRolesQuery, List<RoleDto>>
{
    private readonly IAppDbContext _db;
    public GetRolesQueryHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task<List<RoleDto>> Handle(GetRolesQuery request, CancellationToken ct)
    {
        return await _db.Roles
            .OrderBy(r => r.Name)
            .Select(r => new RoleDto(r.Id, r.Name, r.Description))
            .ToListAsync(ct);
    }
}