using Infera.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Infera.Application.Features.Users.DownloadAvatar;

public class DownloadAvatarQueryHandler : IRequestHandler<DownloadAvatarQuery, DownloadAvatarResult>
{
    private readonly IAppDbContext _db;
    private readonly IFileStorageService _storage;

    public DownloadAvatarQueryHandler(IAppDbContext db, IFileStorageService storage)
    {
        _db = db;
        _storage = storage;
    }

    public async System.Threading.Tasks.Task<DownloadAvatarResult> Handle(DownloadAvatarQuery request, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, ct)
            ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");

        if (string.IsNullOrEmpty(user.AvatarUrl))
            throw new KeyNotFoundException("Bu kullanıcının avatarı yok.");

        var stream = _storage.GetFileStream(user.AvatarUrl);
        var contentType = user.AvatarUrl.EndsWith(".png") ? "image/png" : "image/jpeg";

        return new DownloadAvatarResult(stream, contentType);
    }
}