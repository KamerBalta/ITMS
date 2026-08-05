using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Users.DeleteMyAvatar;

public class DeleteMyAvatarCommandHandler : IRequestHandler<DeleteMyAvatarCommand>
{
    private readonly IAppDbContext _db;
    private readonly IFileStorageService _storage;

    public DeleteMyAvatarCommandHandler(
        IAppDbContext db,
        IFileStorageService storage)
    {
        _db = db;
        _storage = storage;
    }

    public async Task Handle(DeleteMyAvatarCommand request, CancellationToken cancellationToken)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(x => x.Id == request.UserId, cancellationToken)
            ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");

        if (string.IsNullOrWhiteSpace(user.AvatarUrl))
            return;

        _storage.Delete(user.AvatarUrl);

        user.AvatarUrl = null;

        await _db.SaveChangesAsync(cancellationToken);
    }
}