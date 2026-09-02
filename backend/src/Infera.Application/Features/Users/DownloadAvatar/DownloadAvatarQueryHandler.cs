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

    public async Task<DownloadAvatarResult> Handle(
       DownloadAvatarQuery request,
       CancellationToken ct)
    {
        var user = await _db.Users
            .FirstOrDefaultAsync(u => u.Id == request.UserId, ct)
            ?? throw new KeyNotFoundException("Kullanıcı bulunamadı.");

        if (string.IsNullOrWhiteSpace(user.AvatarUrl))
            throw new KeyNotFoundException("Bu kullanıcının avatarı yok.");

        var stream = await _storage.GetFileStreamAsync(
            user.AvatarUrl,
            ct);

        var extension = Path.GetExtension(user.AvatarUrl)
            .ToLowerInvariant();

        var contentType = extension switch
        {
            ".png" => "image/png",
            ".jpg" => "image/jpeg",
            ".jpeg" => "image/jpeg",
            ".webp" => "image/webp",
            ".gif" => "image/gif",
            _ => "application/octet-stream"
        };

        return new DownloadAvatarResult(stream, contentType);
    }
}