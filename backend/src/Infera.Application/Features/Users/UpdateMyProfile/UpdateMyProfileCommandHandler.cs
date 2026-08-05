using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Users.UpdateMyProfile;

public class UpdateMyProfileCommandHandler : IRequestHandler<UpdateMyProfileCommand>
{
    private readonly IAppDbContext _db;
    public UpdateMyProfileCommandHandler(IAppDbContext db) => _db = db;

    public async System.Threading.Tasks.Task Handle(UpdateMyProfileCommand request, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, ct)
            ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");

        if (string.IsNullOrWhiteSpace(request.Name))
            throw new InvalidOperationException("Ad alanı boş olamaz.");

        user.Name = request.Name;
        user.Title = request.Title;
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
    }
}