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
        var user = await _db.Users
            .Where(u => u.Id == request.UserId)
            .Select(u => new UserDetailDto(
                u.Id, u.Name, u.Email, u.Title, u.AvatarUrl, u.IsActive, u.CreatedAt,
                u.UserRoles.Select(ur => ur.Role.Name).ToList()))
            .FirstOrDefaultAsync(ct);

        return user ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");
    }
}